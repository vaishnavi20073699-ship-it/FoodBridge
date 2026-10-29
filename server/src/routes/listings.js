const router = require("express").Router();
const mongoose = require("mongoose");
const Listing = require("../models/Listing");
const DonationRequest = require("../models/DonationRequest");
const { auth, allow } = require("../middleware/auth");

router.get("/", auth, async (req,res,next)=>{
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    else if (req.user.role !== "admin") filter.status = { $ne: "removed" };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.search) {
      const safe = String(req.query.search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [{foodName:new RegExp(safe,"i")},{description:new RegExp(safe,"i")},{location:new RegExp(safe,"i")}];
    }
    const docs = await Listing.find(filter).populate("donor","name organizationName area").sort({createdAt:-1}).lean();
    const ids = docs.map(d=>d._id);
    const reserved = await DonationRequest.aggregate([
      {$match:{listing:{$in:ids},status:{$in:["pending","accepted","completed"]}}},
      {$group:{_id:"$listing",total:{$sum:"$requestedQuantity"}}}
    ]);
    const totals = new Map(reserved.map(r=>[String(r._id),r.total]));
    res.json(docs.map(d=>({...d,reservedQuantity:totals.get(String(d._id))||0,availableQuantity:Math.max(0,d.quantity-(totals.get(String(d._id))||0))})));
  } catch(e){next(e);}
});
router.post("/", auth, allow("donor"), async (req,res,next)=>{
  try {
    const b=req.body;
    const required=["foodName","category","quantity","unit","preparedAt","useByGuidance","pickupWindowStart","pickupDeadline","location","storageInfo"];
    if(required.some(k=>b[k]===undefined||String(b[k]).trim()==="")) return res.status(400).json({error:"Complete all required food, handling and pickup fields."});
    const quantity=Number(b.quantity), preparedAt=new Date(b.preparedAt), start=new Date(b.pickupWindowStart), deadline=new Date(b.pickupDeadline);
    if(!Number.isFinite(quantity)||quantity<=0) return res.status(400).json({error:"Quantity must be greater than zero."});
    if([preparedAt,start,deadline].some(d=>Number.isNaN(d.getTime()))) return res.status(400).json({error:"Enter valid date/time values."});
    if(deadline<=new Date()||start>deadline) return res.status(400).json({error:"Pickup window must be valid and deadline must be in the future."});
    const listing=await Listing.create({...b,quantity,preparedAt,pickupWindowStart:start,pickupDeadline:deadline,donor:req.user._id});
    res.status(201).json(listing);
  }catch(e){next(e);}
});
router.patch("/:id/moderate", auth, allow("admin"), async(req,res,next)=>{
  try {
    const listing=await Listing.findById(req.params.id);
    if(!listing)return res.status(404).json({error:"Listing not found."});
    if(!["remove","restore"].includes(req.body.action))return res.status(400).json({error:"Invalid moderation action."});
    if(req.body.action==="restore"&&listing.pickupDeadline<=new Date())return res.status(400).json({error:"Expired listings cannot be restored."});
    listing.status=req.body.action==="remove"?"removed":"available";
    await listing.save();
    if(req.body.action==="remove"){
      const active=await DonationRequest.find({listing:listing._id,status:{$in:["pending","accepted"]}});
      for(const r of active){r.status="cancelled";r.history.push({status:"cancelled",note:"Cancelled because listing was removed by admin.",actor:req.user.organizationName});await r.save();}
    }
    res.json(listing);
  }catch(e){next(e);}
});
module.exports=router;
