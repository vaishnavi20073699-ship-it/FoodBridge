const router=require("express").Router();
const User=require("../models/User");
const {auth,allow}=require("../middleware/auth");
router.get("/",auth,async(req,res,next)=>{
  try{res.json(await User.find({role:"recipient"}).select("name organizationName area description").sort({organizationName:1}).lean());}catch(e){next(e);}
});
router.patch("/me",auth,allow("recipient"),async(req,res,next)=>{
  try{
    const {name,organizationName,phone,area,description}=req.body;
    if(!name||!organizationName)return res.status(400).json({error:"Contact name and organization name are required."});
    const u=await User.findByIdAndUpdate(req.user._id,{name,organizationName,phone,area,description},{new:true,runValidators:true}).select("name email role organizationName phone area description");
    res.json({user:u});
  }catch(e){next(e);}
});
module.exports=router;
