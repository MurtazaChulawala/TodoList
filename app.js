//importing all the required modules
import express  from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import _ from "lodash";
dotenv.config();
const app = express();

//setting parameters for bodyparser and public folders so that they can be acessible easily
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine', 'ejs');;
app.use(express.static("public"));

let username = process.env.User;
let password = process.env.password;
//connecting to the database with mongoose connect function
const uri = 'mongodb+srv://'+username+':'+password+'@cluster0.xyjh8tr.mongodb.net/TodolistDB';
try {
  await mongoose.connect(uri);  
} catch (error) {
  console.log(error);
}

//creating a schema for to store the tasks of todo app 
const schema = mongoose.Schema({
  task : {
    type : String,
  }
});

//creating a model named task with the above schema to store the data in tasks collection
const Task = mongoose.model("task", schema);

app.get("/",(req,res)=>{    //get function To serve the request on '/'
  res.redirect('/TodoList');
});

app.get("/TodoList", async (req, res) => {    //get function to serve the request on '/TodoList'
  const tasks = await Task.find({});          //awaiting the search for all the data inside the tasks collection
  res.render("list", {listTitle: "TodoList", newListItems: tasks});   //rendering the data on list.ejs file
});

//serving the post request for '/TodoList' and saving the data.
app.post("/TodoList", async (req, res) =>{
  const item = req.body.newItem;    //catching the value entered by the user
  if (item){            //if a value exist then we will go ahead and save it
    const task = new Task({
      task : item
    });
    await task.save();
    res.redirect("/");
  }
  else{
    res.redirect("/");
    }
});

//creating a new schema which will accomodate the array of tasks
let listSchema = mongoose.Schema({
  name : String,
  array : [schema],
});

//new model creation with new collection named lists
const list  = new mongoose.model("list", listSchema);

//serving for the request when user makes on a custom parameter
app.get("/:param", async(req,res)=>{      //serving the get request for different params
  let title = req.params.param;
  title = _.capitalize(title);
  if (title === "Todolist"){
    res.render("/TodoList");
  }
  let lists = await list.findOne({name :`${title}`}).exec();    //finding inside the lists collection for already created data and retreiving it back
  if (lists == null){           //if no data is returned we will create new data with the params entered by the user
    const newentry = new list({
      name : title,
      array : []
    });
    await newentry.save();
    res.redirect(`/${title}`);  
  }
  else{                         //sending all the embeded array to list.ejs for rendering it
  let listitems = lists.array;
  res.render("list", {listTitle: title, newListItems : listitems});
}});

//serving for the data sent by the user on the custom page
app.post("/:param",async (req,res)=>{
  let title = req.params.param;
  title = _.capitalize(title);
  let items = await list.findOne({name : `${title}`});
  const item = req.body.newItem;    //catching the value entered by the user
  if (item){                        // if item contains any value then we will save the document in the database
    let arrayelement = new Task({
      task : item
    });
    items.array.push(arrayelement); //pushing the item in the database array
    await items.save();                   //saving the item
    res.redirect(`/${title}`);  
  }else{           
    res.redirect(`/${title}`);  
}
});

//deleting posts from the normal todolist
app.post("/delete/TodoList",async (req,res)=>{
  let id = req.body.checkbox;
  await Task.deleteOne({_id : id}); //deleting the entry with the help of id
  res.redirect("/");  
});

//deleting the posts from the custom todo list
app.post("/delete/:param",async (req,res)=>{
  let title = req.params.param;
  title = _.capitalize(title);
  let id = req.body.checkbox; 
  const items = await list.findOne({name : title});   //finding the item with the help of title
  items.array.pull({_id : id});                       //removing the element from the array based on its id
      await items.save();                                   //saving the document
      res.redirect(`/${title}`);
});

//get function to serve request for '/about'.
app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT||3000, ()=> {
  console.log("Server started succesfully");
});