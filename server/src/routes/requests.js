const router=require("express").Router();
const mongoose=require("mongoose");
const crypto=require("crypto");
const Listing=require("../models/Listing");
const DonationRequest=require("../models/DonationRequest");
const {auth,allow}=require("../middleware/auth");
const code=()=>String(crypto.randomInt(100000,1000000));

router.get("/",auth,async(req,res,next)=>{
  try{
    const filter={};
    if(req.user.role==="donor"){
      const owned=await Listing.find({donor:req.user._id}).select("_id");
      filter.listing={$in:owned.map(x=>x._id)};
    }else if(req.user.role==="recipient")filter.organization=req.user._id;
    const rows=await DonationRequest.find(filter).populate({path:"listing",populate:{path:"donor",select:"name organizationName area"}}).populate("organization","name organizationName area").sort({createdAt:-1}).lean();
    res.json(rows.map(r=>({...r,pickupCode:undefined,history:r.history||[]})));
  }catch(e){next(e);}
});
router.post("/",auth,allow("recipient"),async(req,res,next)=>{
  const session=await mongoose.startSession();
  try{
    let created;
    await session.withTransaction(async()=>{
      const listing=await Listing.findById(req.body.listingId).session(session);
      if(!listing||listing.status!=="available")throw Object.assign(new Error("This listing is not available."),{status:409});
      if(listing.pickupDeadline<=new Date())throw Object.assign(new Error("The pickup deadline has passed."),{status:409});
      const qty=Number(req.body.requestedQuantity);
      if(!Number.isFinite(qty)||qty<=0)throw Object.assign(new Error("Requested quantity must be greater than zero."),{status:400});
      const agg=await DonationRequest.aggregate([
        {$match:{listing:listing._id,status:{$in:["pending","accepted","completed"]}}},
        {$group:{_id:null,total:{$sum:"$requestedQuantity"}}}
      ]).session(session);
      const reserved=agg[0]?.total||0;
      if(qty+reserved>listing.quantity)throw Object.assign(new Error(`Only ${Math.max(0,listing.quantity-reserved)} ${listing.unit} remain unreserved.`),{status:409});
      const docs=await DonationRequest.create([{
        listing:listing._id,organization:req.user._id,requestedQuantity:qty,note:String(req.body.note||"").slice(0,500),status:"pending",pickupCode:code(),
        history:[{status:"pending",note:"Donation request submitted.",actor:req.user.organizationName}]
      }],{session});
      created=docs[0];
    });
    res.status(201).json({id:created._id,status:created.status,message:"Request submitted. Await donor review."});
  }catch(e){next(e);}finally{await session.endSession();}
});
router.patch("/:id",auth,async(req,res,next)=>{
  const session=await mongoose.startSession();
  try{
    let result;
    await session.withTransaction(async()=>{
      const r=await DonationRequest.findById(req.params.id).select("+pickupCode").session(session);
      if(!r)throw Object.assign(new Error("Request not found."),{status:404});
      const listing=await Listing.findById(r.listing).session(session);
      if(!listing)throw Object.assign(new Error("Listing not found."),{status:404});
      const {action,pickupCode}=req.body;
      if(["accept","reject"].includes(action)){
        if(req.user.role!=="donor"||String(listing.donor)!==String(req.user._id))throw Object.assign(new Error("Only this listing's donor can review it."),{status:403});
        if(r.status!=="pending")throw Object.assign(new Error("Only pending requests can be reviewed."),{status:409});
        if(action==="accept"){
          if(listing.pickupDeadline<=new Date())throw Object.assign(new Error("Pickup deadline has passed."),{status:409});
          const agg=await DonationRequest.aggregate([{$match:{listing:listing._id,status:"accepted",_id:{$ne:r._id}}},{$group:{_id:null,total:{$sum:"$requestedQuantity"}}}]).session(session);
          if((agg[0]?.total||0)+r.requestedQuantity>listing.quantity)throw Object.assign(new Error("Not enough unreserved quantity remains."),{status:409});
          r.status="accepted";
          r.history.push({status:"accepted",note:`Donor accepted. Demo pickup code: ${r.pickupCode}`,actor:req.user.organizationName});
        }else{
          r.status="rejected";r.history.push({status:"rejected",note:"Donor rejected the request.",actor:req.user.organizationName});
        }
      }else if(action==="cancel"){
        const isDonor=req.user.role==="donor"&&String(listing.donor)===String(req.user._id);
        const isRecipient=req.user.role==="recipient"&&String(r.organization)===String(req.user._id);
        if(!isDonor&&!isRecipient)throw Object.assign(new Error("Only the listing donor or requesting organization can cancel."),{status:403});
        if(!["pending","accepted"].includes(r.status))throw Object.assign(new Error("Only pending or accepted requests can be cancelled."),{status:409});
        r.status="cancelled";r.history.push({status:"cancelled",note:"Request cancelled.",actor:req.user.organizationName});
      }else if(action==="complete"){
        if(req.user.role!=="recipient"||String(r.organization)!==String(req.user._id))throw Object.assign(new Error("Only the requesting organization can confirm pickup."),{status:403});
        if(r.status!=="accepted")throw Object.assign(new Error("Only accepted requests can be completed."),{status:409});
        if(String(pickupCode||"")!==String(r.pickupCode))throw Object.assign(new Error("Pickup code does not match."),{status:400});
        r.status="completed";r.history.push({status:"completed",note:`Pickup confirmed for ${r.requestedQuantity} ${listing.unit}.`,actor:req.user.organizationName});
      }else throw Object.assign(new Error("Unsupported request action."),{status:400});
      await r.save({session});
      const agg=await DonationRequest.aggregate([{$match:{listing:listing._id,status:{$in:["pending","accepted","completed"]}}},{$group:{_id:null,total:{$sum:"$requestedQuantity"}}}]).session(session);
      if((agg[0]?.total||0)>=listing.quantity&&listing.status!=="removed"){listing.status="reserved";await listing.save({session});}
      else if(listing.status==="reserved"&&(agg[0]?.total||0)<listing.quantity){listing.status="available";await listing.save({session});}
      result={id:r._id,status:r.status,history:r.history,pickupCode: req.user.role==="recipient"&&r.status==="accepted"?r.pickupCode:undefined};
    });
    res.json(result);
  }catch(e){next(e);}finally{await session.endSession();}
});
router.get("/:id/history",auth,async(req,res,next)=>{
  try{
    const r=await DonationRequest.findById(req.params.id).populate("listing","donor").lean();
    if(!r)return res.status(404).json({error:"Request not found."});
    const owner=(req.user.role==="donor"&&String(r.listing.donor)===String(req.user._id))||(req.user.role==="recipient"&&String(r.organization)===String(req.user._id))||req.user.role==="admin";
    if(!owner)return res.status(403).json({error:"You cannot view this request history."});
    res.json(r.history||[]);
  }catch(e){next(e);}
});
module.exports=router;
