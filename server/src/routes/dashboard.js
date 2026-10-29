const router=require("express").Router();
const Listing=require("../models/Listing");
const DonationRequest=require("../models/DonationRequest");
const Report=require("../models/Report");
const {auth,allow}=require("../middleware/auth");
router.get("/summary",auth,async(req,res,next)=>{
 try{
  const listingFilter=req.user.role==="donor"?{donor:req.user._id}:{};
  const reqFilter=req.user.role==="donor"?{}:req.user.role==="recipient"?{organization:req.user._id}:{};
  if(req.user.role==="donor"){
   const owned=await Listing.find({donor:req.user._id}).select("_id");
   reqFilter.listing={$in:owned.map(x=>x._id)};
  }
  const [listings,pending,accepted,completed,openReports]=await Promise.all([
   Listing.countDocuments({...listingFilter,status:{$ne:"removed"}}),
   DonationRequest.countDocuments({...reqFilter,status:"pending"}),
   DonationRequest.countDocuments({...reqFilter,status:"accepted"}),
   DonationRequest.countDocuments({...reqFilter,status:"completed"}),
   req.user.role==="admin"?Report.countDocuments({status:"open"}):Promise.resolve(0)
  ]);
  res.json({listings,pending,accepted,completed,openReports});
 }catch(e){next(e);}
});
module.exports=router;
