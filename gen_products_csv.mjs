import fs from 'fs';

const vendor = "Dev Mode";
const tags = "developer, coding, AI, software engineer, geek, humor, coffee, devmode, dark mode, tech gift";
const teePrice=27.95, teeCompare=32.95;
const hoodiePrice=44.95, hoodieCompare=54.95;
const mugPrice=19.95, mugCompare=24.95;

const teeColors = ["Black","White"];
const hoodieColors = ["Black","Heather Gray"];
const sizes = ["S","M","L","XL","2XL"];
const mugSizes = ["11oz","15oz"];
const mugColors = ["Black","White"];

const mugTitles = [
  "Code. Coffee. Repeat. Mug","In Dev Mode Mug","Artificially Intelligent Mug","Ship It Friday Mug",
  "I Have No Bugs — Just Features Mug","Hello World Mug","AI Wrote This Mug","Dark Mode Everything Mug",
  "sudo make me a coffee Mug","404 Sleep Not Found Mug",
];

const teeTitles = [
  "Hello World T-Shirt","AI Wrote This Shirt T-Shirt","Dark Mode Everything T-Shirt","sudo make me a coffee T-Shirt",
  "404 Sleep Not Found T-Shirt","Code. Coffee. Repeat. T-Shirt","In Dev Mode T-Shirt","Artificially Intelligent T-Shirt",
  "Ship It Friday T-Shirt","I Have No Bugs — Just Features T-Shirt",
];

const hoodieTitles = [
  "Hello World Hoodie","Dark Mode Everything Hoodie","404 Sleep Not Found Hoodie",
  "Code. Coffee. Repeat. Hoodie","In Dev Mode Hoodie",
];

const headers = [
  "Handle","Title","Body (HTML)","Vendor","Type","Tags","Published",
  "Option1 Name","Option1 Value","Option2 Name","Option2 Value","Option3 Name","Option3 Value",
  "Variant SKU","Variant Grams","Variant Inventory Tracker","Variant Inventory Qty","Variant Inventory Policy",
  "Variant Fulfillment Service","Variant Price","Variant Compare At Price","Variant Requires Shipping",
  "Variant Taxable","Variant Barcode","Image Src","Image Position","Image Alt Text","Gift Card",
  "SEO Title","SEO Description","Variant Weight Unit","Status"
];

function handleize(s){
  return s.toLowerCase().replace(/—|–/g,'-').replace(/'/g,'').replace(/\./g,'').replace(/\s+/g,'-');
}
function rowObj(){
  return {
    "Handle":"","Title":"","Body (HTML)":"","Vendor":vendor,"Type":"","Tags":tags,"Published":"TRUE",
    "Option1 Name":"","Option1 Value":"","Option2 Name":"","Option2 Value":"","Option3 Name":"","Option3 Value":"",
    "Variant SKU":"","Variant Grams":0,"Variant Inventory Tracker":"","Variant Inventory Qty":0,"Variant Inventory Policy":"deny",
    "Variant Fulfillment Service":"manual","Variant Price":"","Variant Compare At Price":"","Variant Requires Shipping":"TRUE",
    "Variant Taxable":"TRUE","Variant Barcode":"","Image Src":"","Image Position":"","Image Alt Text":"","Gift Card":"FALSE",
    "SEO Title":"","SEO Description":"","Variant Weight Unit":"g","Status":"active"
  };
}

const rows = [];

// Mugs
for (const title of mugTitles){
  const h = handleize(title);
  const body = "<p>Minimalist developer mug with monospaced design. Dishwasher and microwave safe. Handle-left orientation. Brand: Dev Mode.</p>";
  const seoTitle = `${title} | Dev Mode Mug for Programmers`;
  const seoDesc  = "Clean monospaced design for coders and AI lovers. Printed on demand in the USA. Perfect gift for developers.";
  let first = true;
  for (const size of mugSizes){
    for (const color of mugColors){
      const r = rowObj();
      r["Handle"]=h;
      r["Title"]= first ? title : "";
      r["Body (HTML)"]= first ? body : "";
      r["Type"]="Mug";
      r["Option1 Name"]="Size"; r["Option1 Value"]=size;
      r["Option2 Name"]="Color"; r["Option2 Value"]=color;
      r["Variant Price"]=mugPrice; r["Variant Compare At Price"]=mugCompare;
      r["SEO Title"]= first ? seoTitle : ""; r["SEO Description"]= first ? seoDesc : "";
      r["Image Alt Text"]=`${title} - ${size} - ${color}`;
      rows.push(r); first=false;
    }
  }
}

// Tees
for (const title of teeTitles){
  const h = handleize(title);
  const body = "<p>Premium unisex tee (Bella+Canvas 3001). Large back design in monospaced type. Small Dev Mode logo on left chest. Soft and lightweight.</p>";
  const seoTitle = `${title} | Dev Mode T-Shirt for Developers`;
  const seoDesc  = "Monospaced developer tee built for dark mode lovers. Clean design, premium feel. Printed on demand in the USA.";
  let first = true;
  for (const color of teeColors){
    for (const size of sizes){
      const r = rowObj();
      r["Handle"]=h;
      r["Title"]= first ? title : "";
      r["Body (HTML)"]= first ? body : "";
      r["Type"]="T-Shirt";
      r["Option1 Name"]="Color"; r["Option1 Value"]=color;
      r["Option2 Name"]="Size"; r["Option2 Value"]=size;
      r["Variant Price"]=teePrice; r["Variant Compare At Price"]=teeCompare;
      r["SEO Title"]= first ? seoTitle : ""; r["SEO Description"]= first ? seoDesc : "";
      r["Image Alt Text"]=`${title} - ${color} - ${size}`;
      rows.push(r); first=false;
    }
  }
}

// Hoodies
for (const title of hoodieTitles){
  const h = handleize(title);
  const body = "<p>Premium fleece hoodie. Large back design in monospaced type. Small contrasting Dev Mode logo on left sleeve cuff.</p>";
  const seoTitle = `${title} | Dev Mode Hoodie for Developers`;
  const seoDesc  = "Monospaced developer hoodie with sleeve logo. Clean streetwear aesthetic. Printed on demand in the USA.";
  let first = true;
  for (const color of hoodieColors){
    for (const size of sizes){
      const r = rowObj();
      r["Handle"]=h;
      r["Title"]= first ? title : "";
      r["Body (HTML)"]= first ? body : "";
      r["Type"]="Hoodie";
      r["Option1 Name"]="Color"; r["Option1 Value"]=color;
      r["Option2 Name"]="Size"; r["Option2 Value"]=size;
      r["Variant Price"]=hoodiePrice; r["Variant Compare At Price"]=hoodieCompare;
      r["SEO Title"]= first ? seoTitle : ""; r["SEO Description"]= first ? seoDesc : "";
      r["Image Alt Text"]=`${title} - ${color} - ${size}`;
      rows.push(r); first=false;
    }
  }
}

function toCSV(objs){
  const cols = headers;
  const esc = v => {
    if (v===null || v===undefined) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
  };
  const lines = [];
  lines.push(cols.join(','));
  for (const o of objs){
    lines.push(cols.map(k => esc(o[k] ?? "")).join(','));
  }
  return lines.join('\n');
}

const productCsv = toCSV(rows);
fs.writeFileSync('./Shopify_DevMode_ProductImport.csv', productCsv, 'utf8');

// Build mapping template
const mapHeaders = ["Handle","Title","Type","Opt1 Name","Opt1 Value","Opt2 Name","Opt2 Value","Variant Label","Printful Product ID","Printful Variant ID","Mockup File","Artwork File","Notes"];
const mappingRows = rows.map(r => ({
  "Handle": r["Handle"],
  "Title": r["Title"] || "",
  "Type": r["Type"],
  "Opt1 Name": r["Option1 Name"],
  "Opt1 Value": r["Option1 Value"],
  "Opt2 Name": r["Option2 Name"],
  "Opt2 Value": r["Option2 Value"],
  "Variant Label": r["Image Alt Text"],
  "Printful Product ID": "",
  "Printful Variant ID": "",
  "Mockup File": "",
  "Artwork File": "",
  "Notes": ""
}));

const toCSVCustom = (cols, rows) => {
  const esc = v => {
    if (v===null || v===undefined) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
  };
  return [cols.join(','), ...rows.map(r => cols.map(c => esc(r[c] ?? "")).join(','))].join('\n');
};
fs.writeFileSync('./DevMode_Printful_Mapping_Template.csv', toCSVCustom(mapHeaders, mappingRows), 'utf8');

console.log('✓ Wrote Shopify_DevMode_ProductImport.csv');
console.log('✓ Wrote DevMode_Printful_Mapping_Template.csv');
