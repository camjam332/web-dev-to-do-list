//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require("lodash");
require('dotenv').config();
const PORT = process.env.PORT || 3000
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const itemSchema = new mongoose.Schema({
  name: String
});

const Item = new mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Welcome to your To Do List!"
})

const item2 = new Item({
  name: "Hit the + button to add a new item!"
})

const item3 = new Item({
  name: "<-- Hit this to delete an item!"
})

var defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
})

const List = mongoose.model("List", listSchema);

app.get("/", async function(req, res) {
  let items = await Item.find({});
  if(items.length === 0){
    Item.insertMany(defaultItems);
    res.redirect('/');
  }
  else{
    res.render("list", {listTitle: "Today", newListItems: items});
  }
});


app.get("/:customListName", async function(req, res){
  const customListName = _.capitalize(req.params.customListName);
  var list = await List.findOne({name: customListName});
  if(!list){
    console.log(`List does not exist, new list created for ${customListName}`);
    const list = new List({
      name: customListName,
      items: defaultItems
    });
    list.save();
    res.render("list", {listTitle: list.name, newListItems: list.items});
  }
  else{
    if(list.name === customListName){
      res.render("list", {listTitle: list.name, newListItems: list.items});
    }
  }
})

app.post("/", async function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  })
  if(listName === "Today"){
    item.save();
    res.redirect('/');
  }
  else{
    var list = await List.findOne({name: listName});
    list.items.push(item);
    list.save();
    res.redirect('/' + listName)
  }

});

app.post('/delete', async function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if(listName === "Today"){
    await Item.deleteOne({_id: checkedItemId});
    res.redirect('/');
  }
  else{
    await List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}});
    res.redirect('/' + listName);
  }
})

app.get("/about", function(req, res){
  res.render("about");
});

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGODB);
    app.listen(PORT, function() {
      console.log("Server started on port 3000");
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

start();


