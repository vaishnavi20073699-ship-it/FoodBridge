require("dotenv").config({path:require("path").join(__dirname,"../.env")});
const bcrypt=require("bcryptjs");
const mongoose=require("mongoose");
const User=require("./models/User");
const Listing=require("./models/Listing");
const DonationRequest=require("./models/DonationRequest");
const Report=require("./models/Report");
const connectDB=require("./config/db");
(async()=>{
 try{
  await connectDB();
  const password=process.env.SEED_DEMO_PASSWORD||"DemoFoodBridge123!";
  const passwordHash=await bcrypt.hash(password,12);
  const demoUsers=[
   {name:"Sunrise Restaurant",email:"sunrise@example.test",role:"donor",organizationName:"Sunrise Restaurant",phone:"000-000-0001",area:"Madhapur"},
   {name:"Green Leaf Hotel",email:"greenleaf@example.test",role:"donor",organizationName:"Green Leaf Hotel",phone:"000-000-0002",area:"Kondapur"},
   {name:"City Caterers",email:"citycaterers@example.test",role:"donor",organizationName:"City Caterers",phone:"000-000-0003",area:"Gachibowli"},
   {name:"Helping Hands Coordinator",email:"helpinghands@example.test",role:"recipient",organizationName:"Helping Hands Foundation",phone:"000-000-0011",area:"Madhapur",description:"Community meal distribution and local relief."},
   {name:"Hope Kitchen Coordinator",email:"hopekitchen@example.test",role:"recipient",organizationName:"Hope Community Kitchen",phone:"000-000-0012",area:"Kondapur",description:"Prepares and distributes meals to local communities."},
   {name:"Annapurna Outreach Coordinator",email:"annapurna@example.test",role:"recipient",organizationName:"Annapurna Outreach Trust",phone:"000-000-0013",area:"Gachibowli",description:"Coordinates food support through volunteers."},
   {name:"FoodBridge Admin",email:"admin@example.test",role:"admin",organizationName:"FoodBridge Admin",phone:"000-000-0099",area:"Hyderabad"}
  ];
  const users=[];
  for(const u of demoUsers)users.push(await User.findOneAndUpdate({email:u.email},{...u,passwordHash},{upsert:true,new:true,setDefaultsOnInsert:true}));
  const donorByEmail=Object.fromEntries(users.map(u=>[u.email,u]));
  await DonationRequest.deleteMany({});
  await Report.deleteMany({});
  await Listing.deleteMany({donor:{$in:users.filter(u=>u.role==="donor").map(u=>u._id)}});
  const now=Date.now();
  const dt=m=>new Date(now+m*60000);
  const raw=[
   ["Vegetable rice","Freshly prepared vegetarian rice meals.","Rice meals",20,"meals",-25,1440,"Sunrise Restaurant, Madhapur","Covered containers; keep hot and collect promptly.","May contain traces of nuts"],
   ["Chapati and curry","Chapati portions with mixed vegetable curry.","Indian meals",30,"portions",-35,1500,"Green Leaf Hotel, Kondapur","Covered food-grade containers; transport promptly.","Wheat/gluten"],
   ["Packed lunch boxes","Rice, dal and vegetable side dish.","Packed meals",50,"boxes",-20,1560,"City Caterers, Gachibowli","Sealed meal boxes; follow stated handling requirements.","May contain common allergens"],
   ["Idli and sambar","Steamed idli with sambar portions.","Breakfast",25,"portions",-15,1380,"Sunrise Restaurant, Madhapur","Keep covered; collect within the listed window.","Not specified"],
   ["Lemon rice","Lemon rice in food-grade containers.","Rice meals",18,"portions",-30,1470,"Green Leaf Hotel, Kondapur","Keep covered and avoid prolonged room-temperature storage.","Not specified"],
   ["Vegetable pulao","Mild vegetable pulao portions.","Rice meals",35,"portions",-18,1530,"City Caterers, Gachibowli","Lidded containers; prompt pickup required.","May contain traces of nuts"],
   ["Bread sandwiches","Vegetarian sandwiches, individually wrapped.","Bakery",15,"packs",-10,1350,"Sunrise Restaurant, Madhapur","Keep covered; collect within the pickup window.","Wheat/gluten; may contain dairy"],
   ["Curd rice","Curd rice portions in sealed tubs.","Rice meals",12,"tubs",-12,1320,"Green Leaf Hotel, Kondapur","Keep chilled; do not collect if safe cold storage cannot be maintained.","Milk/dairy"],
   ["Fruit boxes","Cut seasonal fruit portions.","Fruit",22,"boxes",-8,1410,"City Caterers, Gachibowli","Keep chilled and covered; prompt pickup required.","Not specified"],
   ["Dal and rice","Simple dal and rice meals.","Indian meals",28,"meals",-22,1490,"Sunrise Restaurant, Madhapur","Covered containers; transport promptly and follow local rules.","May contain traces of gluten"]
  ];
  const donors=[donorByEmail["sunrise@example.test"],donorByEmail["greenleaf@example.test"],donorByEmail["citycaterers@example.test"]];
  await Listing.insertMany(raw.map((r,i)=>({donor:donors[r[0]==="Chapati and curry"||r[0]==="Lemon rice"||r[0]==="Curd rice"?1:r[0]==="Packed lunch boxes"||r[0]==="Vegetable pulao"||r[0]==="Fruit boxes"?2:0]._id,foodName:r[0],description:r[1],category:r[2],quantity:r[3],unit:r[4],preparedAt:dt(r[5]),pickupWindowStart:dt(r[6]-120),pickupDeadline:dt(r[6]),location:`Demo: ${r[7]}`,useByGuidance:"Follow donor-provided use-by guidance; collect promptly and do not use if safety is uncertain.",storageInfo:r[8],allergens:r[9],status:"available"})));
  console.log(`Seed complete. Demo password for all accounts: ${password}`);
  await mongoose.disconnect();
 }catch(e){console.error(e);process.exit(1);}
})();
