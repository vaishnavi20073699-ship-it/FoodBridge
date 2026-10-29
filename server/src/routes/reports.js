const router=require("express").Router();
const Report=require("../models/Report");
const Listing=require("../models/Listing");
const {auth,allow}=require("../middleware/auth");
router.get("/",auth,allow("admin"),async(req,res,next)=>{
  try{res.json(await Report.find().populate("listing","foodName location status").populate("reporter","name organizationName").sort({createdAt:-1}).lean());}catch(e){next(e);}
});
router.post("/",auth,async(req,res,next)=>{
  try{
    if(!req.body.reason)return res.status(400).json({error:"Choose a report reason."});
    if(req.body.listingId&&!await Listing.exists({_id:req.body.listingId}))return res.status(404).json({error:"Listing not found."});
    const r=await Report.create({listing:req.body.listingId||null,reporter:req.user._id,reason:String(req.body.reason).slice(0,160),details:String(req.body.details||"").slice(0,1000)});
    res.status(201).json({id:r._id,status:r.status});
  }catch(e){next(e);}
});
router.patch("/:id/resolve",auth,allow("admin"),async(req,res,next)=>{
  try{const r=await Report.findByIdAndUpdate(req.params.id,{status:"resolved"},{new:true});if(!r)return res.status(404).json({error:"Report not found."});res.json({id:r._id,status:r.status});}catch(e){next(e);}
});
module.exports=router;
