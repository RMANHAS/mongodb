var mongoose = require("mongoose");
let ObjectId = mongoose.Types.ObjectId;
const fs = require("fs");
const path = require("path");
//var filename = path.basename('C:\Users\ACER\Downloads\Untitled 2.ods')
let temp_Directory = path.join(process.cwd() + "/data/");
const xlreader = require('xlsx');
const csvtojsonV2 = require("csvtojson");
var seed = require("./models/seeds");


//const DATABASE_CONECTION = "mongodb://127.0.0.1:27017/data?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+1.8.0";
const DATABASE_CONECTION = "mongodb://127.0.0.1:27017/data?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+1.8.2"


mongoose.connection.on("disconnected", function () {
  console.log("Mongoose default connection is disconnected");
});

mongoose.connection .on("error", function (err) {
  console.log("Mongoose default connection has occured " + err + " error");
});
mongoose.connect(DATABASE_CONECTION, { useNewUrlParser: true, useUnifiedTopology: true });

var db = mongoose.connection;

async function closeDb() {
  console.log("imout");
  db.close(function () {
    console.log("Mongoose connection disconnected");
  });
  mongoose.disconnect();
}


async function start(filename, company) {
  try {
    // var reader = new FileReader();
    // reader.setNodeChunkedEncoding(false);
    let ext = filename.split(".").pop().toLowerCase();
    console.log("file", ext);
    var Data = [];
    console.log("this is temp_directory", temp_Directory)
    if (ext == "xlsx" || ext == "xls" || ext == "ods") {
      const wb = await xlreader.readFile(temp_Directory + filename);// XLSX.read(binarystr, { type: "binary" });
      /* selected the first sheet */
      const wsname = await wb.SheetNames[1];
      const ws = await wb.Sheets[wsname];
      /* save data */
      let data = await xlreader.utils.sheet_to_json(ws, { header: 1 });
      Data = await parseFileData(data);
    }
    else if (ext == "csv") {
      let data = await csvtojsonV2().fromFile(temp_Directory + filename);
      Data = await parseFileData(data);
      console.log("this is data", data)
      console.log("this is Data", Data)
    }
    else if (ext == "json") {
      let data = fs.readFileSync(temp_Directory + filename, { encoding: 'UTF-8' });
      Data = await parseFileData(data, "true");
    }
    else {
      console.log("Only execl, csv or json file type allowed");
    }
    if (Data.length > 1) {
      var makes = {};
      console.log("this is makes", makes) // "hyundai" : 
      // { 
      //   id : "mongoid", 
      //   i10 :   "mongoid",
      // }
      var types = {}; // "car" : 
      console.log("ths is types", types)
      // { 
      //   id : "mongoid", 
      //   suv : {
      //     id : "mongoid",
      //     toyota : {
      //       id : "mongoid", 
      //       fortuner : "mongoid",
      //     }
      //   },  
      // },
      await asyncForEach(Data, async (col) => {
        var categoryId;
        // categoryId = '618cefc4fd04900d83efdf2a';
        // categoryId = '6191ffb68e0a9f0ab4ed68ee';

        let nModel = (col.MODEL_DESC);
        console.log("this is nmodel")

        // let nModel = (col.subcategory).trim();

        let nMake = (col.Make_Name);
        console.log("tyhis is nmake")
        // let nMake = (col.category).trim();




        let nCategory = col.Make_Name ? (col.Make_Name) : "anil";

        let nType = col.TYPE ? (col.TYPE) : "anil";
        if (nMake?.includes('&')) {
          nMake = nMake.split('&').join('and');
        }

        

        if (nModel?.includes('&')) {
          nModel = nModel?.split('&').join('and');
        }

        nModelL = nModel?.toLowerCase();
        nMakeL = nMake?.toLowerCase();
        nCategory = nCategory?.toLowerCase();
        nType = nType?.toLowerCase();

        //console.log("this is error checking")

        typeId = types && types[nType] ? types[nType].id : null;
         console.log("this is typeId", typeId)
        categoryId = types && types[nType] && types[nType][nCategory] ? types[nType][nCategory].id : null;
         console.log("this is ctegoryid", categoryId)
        makeId = (makes && makes[nMakeL] ? makes[nMakeL].id : null);
        console.log("this is makeId")
        let mAb = nMakeL?.split(" ").join("_");
        

        if (categoryId == null) {
          console.log('start of categoryid')
          let s = {
            
            app: null,
            companyId: null,
            branchId: null,
            class: "makes",
            title: nMakeL,
            abbr: mAb,
            parentId: parId,
            status: "active",
          }
          console.log('this is seed')

          let td = await seed.create(s);
          console.log("this is td S", td)

          categoryId = td._id;

          console.log("this is categoryId td._id", td._id)
          console.log("categoryId created", categoryId)

          //var parId = [ObjectId(categoryId)];
          var parId = [categoryId];

          console.log("this is parId", parId);


          let make = await seed.findOne({ class: "makes", title: nMakeL, parentId: { $all: parId } });
          if (make && make._id) {
            categoryId = make._id + '';
            let a = await seed.findOneAndUpdate({ _id: make._id }, { $set: { abbr: mAb } });
          } else {
            let s = {
              app: null,
              companyId: null,
              branchId: null,
              class: "makes",
              title: nMakeL,
              abbr: mAb,
              parentId: parId,
              status: "active",
            }
            let td = await seed.create(s);
            console.log("this is td", td)
            categoryId = td._id;
            console.log("this is categoryId td._id", categoryId)
          }
        }
        if (categoryId >= 24) {
          // let pIDs = [ObjectId(makeId), ObjectId(categoryId)];
          let pIDs = [makeId,categoryId];
          let bAb = nModelL?.split(" ").join("_");
          let model = await seed.findOne({ class: "brands", "title": nModelL, parentId: { $all: pIDs } });
          if (model && model._id) {
            console.log("already created", model._id);
            let a = await seed.findOneAndUpdate({ _id: model._id }, { $set: { abbr: bAb, "others": { "changeType": true } } });
          }
          else {
            let s = {
              app: null,
              companyId: null,
              branchId: null,
              class: "brands",
              title: nModelL,
              abbr: bAb,
              "others": { "changeType": true },
              parentId: pIDs,
              status: "active",

            }
            let td = await seed.create(s);
            console.log("new created", td);

          }
        } else {
          console.log("not created", col);
        }
         console.log("this is the mAKE ID")
        if (makeId == null) {
          console.log("start makeid")



          let nMakeData = {
            app: null,
            companyId: null,
            branchId: null,
            class: "makes",
            title: nMakeL,
            abbr: mAb,
            parentId: parId,
            status: "active",
          }
          let t = await seed.create(nMakeData);
          console.log("this is t ", t)
          makeId = t._id + '';
          console.log("makeid else", makeId)
          console.log("makeid", makeId)
          // var parId = [ObjectId(categoryId)];
          var parId =[categoryId];

          let make = await seed.findOne({ class: "makes", title: nMakeL, parentId: { $all: parId } });
          if (make && make._id) {

            makeId = make._id + '';

            console.log("makeid", makeId)

            let a = await seed.findOneAndUpdate({ _id: make._id }, { $set: { abbr: mAb } });
          } else {
            let nMakeData = {
              app: null,
              companyId: null,
              branchId: null,
              class: "makes",
              title: nMakeL,
              abbr: mAb,
              parentId: parId,
              status: "active",
            }
            let t = await seed.create(nMakeData);
            console.log("this is t ", t)
            makeId = t._id + '';
            console.log("makeid else", makeId)

            //categoryId != null ? (types[nType][nCategory][nMake] = { id: t._id + '' }) : (makes[nMake] = { id: t._id + '' });


          }
        }
        if (makeId.length >= 24) {
          // let pIDs = [ObjectId(makeId), ObjectId(categoryId)];
          let pIDs = [makeId, categoryId];

          console.log("this is pids",pIDs)
          let bAb = nModelL?.split(" ").join("_");
          //let bAb = nModelL;
          let model = await seed.findOne({ class: "brands", "title": nModelL, parentId: { $all: pIDs } });
          if (model && model._id) {
            console.log("already created", model._id);
            let a = await seed.findOneAndUpdate({ _id: model._id }, { $set: { abbr: bAb, "others": { "chnageType": true } } });
          }
          else {
            let nmodelData = {
              app: null,
              companyId: null,
              branchId: null,
              class: "brands",
              title: nModelL,
              abbr: bAb,
              "others": { "chnageType": true },
              parentId: pIDs,
              status: "active",

            }
            let t = await seed.create(nmodelData);

            console.log("new created", t);
          }
        } else {
          console.log("not created", col);
        }
      }
      );
      await closeDb();

      
    } else {
      await closeDb();
      
    }
  } catch (err) {
    console.error(err);
    closeDb();
  }
}
//vehicleCategories, vehicleSubCategories, makes, brands
let asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};
// async function formateCamelCase(k) {
//   var str = k.replace(/([A-Z])/g, ' $1').trim()
//   return str.replace(/(^|\s)[a-z]/g, upperCase);
// }
// function upperCase(str) {
//   return str.toUpperCase();
// }
async function parseFileData(data, key) {
  console.log("this is parse data");
  var rawfileData = [];
  var crationKeys = [
     //"TYPE",
     //"CATEGORY",
    //"Make_Name",
    //"MODEL_DESC"
    "TYPE",
    "MAKE",
    "MAKE_NAME",
    "MODEL"
  ];

  var mapKeys = [];
  if (key) {
    if (data && typeof data == "object") {
      let a = Object.keys(data);
      if (a && a.length == 1 && Array.isArray(data[a[0]])) {
        await asyncForEach(data[a[0]], async (row, i) => {
          if (row && row.length > 3) {
            let vit = {};
            await asyncForEach(row, async (col, j) => {
              if (col != null || col != undefined || col != "") {
                let mapIndex = await mapKeys.findIndex((o) => o.index == j);
                if (mapIndex >= 0) {
                  vit[mapKeys[mapIndex].keyName] = col;
                }
                else {
                  let keyIndex = await crationKeys.findIndex((o) => o == col);
                  if (keyIndex >= 0) {
                    let mapIndex2 = await mapKeys.findIndex((o) => o.keyName == col);
                    if (mapIndex2 < 0) {
                      mapKeys.push({ keyName: crationKeys[keyIndex], index: j });
                    }
                  }
                }
              }
            });
            if (vit && vit["MAKE_NAME"] && vit["MODEL"]) {
              rawfileData.push(vit);
            }
          }
        });
      } else if (a && a.length > 4) {
        let vit = {};
        for (let index = 0; index < a.length; index++) {
          if (typeof data[a[index]] != "object" && !Array.isArray(data[a[index]]) &&
            (data[a[index]] != null || data[a[index]] != undefined || data[a[index]] != "")) {
            let keyIndex = crationKeys.findIndex((o) => o == a[index]);
            if (keyIndex >= 0) {
              vit[a[index]] = data[a[index]];
            }
          }
        }
        if (vit && vit["MAKE_NAME"] && vit["MODEL"]) {
          rawfileData.push(vit);
        }
      } else {
        console.log("JSON format is not valid");
      }
    } else if (data && data.length > 0) {
      await asyncForEach(data, async (row, i) => {
        if (row && row.length > 3) {
          let vit = {};
          await asyncForEach(row, async (col, j) => {
            if (col != null || col != undefined || col != "") {
              let mapIndex = await mapKeys.findIndex((o) => o.index == j);
              if (mapIndex >= 0) {
                vit[mapKeys[mapIndex].keyName] = col;
              }
              else {
                let keyIndex = await crationKeys.findIndex((o) => o == col);
                if (keyIndex >= 0) {
                  let mapIndex2 = await mapKeys.findIndex((o) => o.keyName == col);
                  if (mapIndex2 < 0) {
                    mapKeys.push({ keyName: crationKeys[keyIndex], index: j });
                  }
                }
              }
            }
          });
           //if (vit && vit["Make_Name"] && vit["MODEL_DESC"])
          if (vit && vit["MAKE_NAME"] && vit["MODEL"]) 
          {
            rawfileData.push(vit);
          }
        }
      });
    } else {
      console.log("Empty file uploaded or not able to parse");
    }
  } else {
    if (data && data.length > 0) {
      await asyncForEach(data, async (row, i) => {
        // console.log("this is row", row);
        if (row && typeof row == "object") {
          let a = Object.keys(row);

          if (a && a.length > 1) {

            let vit = {};
            //await asyncForEach(a, async (col, j)
            await asyncForEach(a, async (col, j) => {
              if (col != null && col != undefined && col != "") {
                col = col.toString();
                let mapIndex = await mapKeys.findIndex((o) => o.index == j);
                console.log(col, j, mapIndex, mapKeys, rawfileData.length, "tilda");
                if (mapIndex >= 0) {
                  vit[mapKeys[mapIndex].keyName] = col;


                }
                else {
                  let keyIndex = await crationKeys.findIndex((o) => o == col);
                  if (keyIndex >= 0) {
                    let mapIndex2 = await mapKeys.findIndex((o) => o.keyName == col);
                    if (mapIndex2 < 0) {
                      mapKeys.push({ keyName: crationKeys[keyIndex], index: j });
                      vit[crationKeys[keyIndex]] = col;


                    }
                  }
                }
              }
            });

            //if (vit && vit["Make_Name"] && vit["MODEL_DESC"])
            if (vit && vit["MAKE_NAME"] && vit["MODEL"]) 
            {
              rawfileData.push(vit);


            }
          }
        }
        else if (row && row.length > 1) {

          let vit = {};
          await asyncForEach(row, async (col, j) => {
            if (col != null && col != undefined && col != "") {
              col = col.toString();



              let mapIndex = await mapKeys.findIndex((o) => o.index == j);
              console.log(col, j, mapIndex, mapKeys, rawfileData.length, "tilda");
              if (mapIndex >= 0) {
                vit[mapKeys[mapIndex].keyName] = col;
              }
              else {
                let keyIndex = await crationKeys.findIndex((o) => o == col);
                if (keyIndex >= 0) {
                  let mapIndex2 = await mapKeys.findIndex((o) => o.keyName == col);
                  if (mapIndex2 < 0) {
                    mapKeys.push({ keyName: crationKeys[keyIndex], index: j });
                    vit[crationKeys[keyIndex]] = col;
                  }
                }
              }
            }
          });
          //if (vit && vit["Make_Name"] && vit["MODEL_DESC"])
          if (vit && vit["MAKE_NAME"] && vit["MODEL"]) 
          {
            rawfileData.push(vit);
          }
        }
      });
    } else {
      console.log("Empty file uploaded or not able to parse");
    }
  }
  if (rawfileData.length > 0) {
    return rawfileData;
  } else {
    console.log("File Data format is not valid");
    return false;
  }
}
start("test1.csv");











//           if(company){
            
//             if(makeId == null){
//               var parId = [ObjectId(categoryId)];
//               let mAb = nMakeL.split(" ").join("_");
//               let make =  await seed.findOne({ class: "makes", companyId: ObjectId(company), "title": nMakeL, parentId:{$all :parId}});
//               if(make && make._id){
//                 makeId = make._id+'';
//                 let a = await seed.findOneAndUpdate({_id:make._id},{$set:{abbr:mAb}});
//               } else {
//                 let nMakeData = {
//                   app: null,
//                   companyId: ObjectId(company),
//                   branchId: null,
//                   class: "makes",
//                   title: nMakeL,
//                   abbr: mAb,
//                   parentId: parId,
//                   status: "active",
//                 }
//                 let t = await seed.create(nMakeData); 
//                 makeId = t._id+'';
//                 /// categoryId != null ? ( types[nType][nCategory][nMake] = { id: t._id+''}) : (makes[nMake] = { id: t._id+''});
//               }
//             }
//             if(makeId.length >= 24){
//               let pIDs = [ObjectId(makeId),ObjectId(categoryId)];
//               let bAb = nModelL.split(" ").join("_");
//               let model = await seed.findOne({ class:"brands", companyId:ObjectId(company), "title": nModelL, parentId:{$all:pIDs }});
//               if(model && model._id){
//                 console.log("already created",  model._id);
//                 let a = await seed.findOneAndUpdate({_id:model._id},{$set:{abbr:bAb,"others":{"chnageType":true}}});
//               } 
//               else {
//                 let nmodelData = {
//                   app: null,
//                   companyId: ObjectId(company),
//                   branchId: null,
//                   class: "brands",
//                   title: nModelL,
//                   abbr: bAb,
//                   "others":{"chnageType":true},
//                   parentId: pIDs,
//                   status: "active",
//                 }
//                 let t = await seed.create(nmodelData); 
//                 console.log("new created",  t);
//               }
//             } else {
//               console.log("not created", col ); 
//             }
//           }
//         });
//         await closeDb();
//     } else {
//         await closeDb();
//     }
//   } catch (err) {
//     console.error(err);
//     closeDb();
//   }
// }
// // vehicleCategories, vehicleSubCategories, makes, brands
// let asyncForEach = async (array, callback) => {
//   for (let index = 0; index < array.length; index++) {
//     await callback(array[index], index, array);
//   }
// };
// async function formateCamelCase(k) {
//   var str = k.replace(/([A-Z])/g, ' $1').trim()
//   return str.replace(/(^|\s)[a-z]/g, upperCase);
// }
// function upperCase(str) {
//   return str.toUpperCase();
// }
// async function parseFileData(data, key) {
//     console.log(data,"parse data");
//   var rawfileData = [];
//   var crationKeys = [
//     "TYPE",
//     "CATEGORY",
//     "Make_Name",
//     "MODEL_DESC"
//   ];
//   var mapKeys = [];
//   if (key) {
//     if (data && typeof data == "object") {
//       let a = Object.keys(data);
//       if (a && a.length == 1 && Array.isArray(data[a[0]])) {
//         await asyncForEach(data[a[0]], async (row, i) => {
//           if (row && row.length > 3) {
//             let vit = {};
//             await asyncForEach(row, async (col, j) => {
//               if (col != null || col != undefined || col != "") {
//                 let mapIndex = await mapKeys.findIndex((o) => o.index == j);
//                 if (mapIndex >= 0) {
//                   vit[mapKeys[mapIndex].keyName] = col;
//                 } 
//                 else {
//                   let keyIndex = await crationKeys.findIndex((o) => o == col);
//                   if (keyIndex >= 0) {
//                     let mapIndex2 = await mapKeys.findIndex( (o) => o.keyName == col);
//                     if (mapIndex2 < 0) {
//                       mapKeys.push({ keyName: crationKeys[keyIndex], index: j });
//                     }
//                   }
//                 }
//               }
//             });
//             if (vit && vit["Make_Name"] && vit["MODEL_DESC"]) {
//               rawfileData.push(vit);
//             }
//           }
//         });
//       } else if (a && a.length > 4) {
//         let vit = {};
//         for (let index = 0; index < a.length; index++) {
//           if ( typeof data[a[index]] != "object" && !Array.isArray(data[a[index]]) && 
//             (data[a[index]] != null || data[a[index]] != undefined || data[a[index]] != "") ) {
//             let keyIndex = crationKeys.findIndex((o) => o == a[index]);
//             if (keyIndex >= 0) {
//               vit[a[index]] = data[a[index]];
//             }
//           }
//         }
//         if (vit && vit["Make_Name"] && vit["MODEL_DESC"]) {
//           rawfileData.push(vit);
//         }
//       } else {
//         console.log("JSON format is not valid");
//       }
//     } else if (data && data.length > 0) {
//       await asyncForEach(data, async (row, i) => {
//         if (row && row.length > 3) {
//           let vit = {};
//           await asyncForEach(row, async (col, j) => {
//             if (col != null || col != undefined || col != "") {
//               let mapIndex = await mapKeys.findIndex((o) => o.index == j);
//               if (mapIndex >= 0) {
//                 vit[mapKeys[mapIndex].keyName] = col;
//               } 
//               else {
//                 let keyIndex = await crationKeys.findIndex((o) => o == col);
//                 if (keyIndex >= 0) {
//                   let mapIndex2 = await mapKeys.findIndex( (o) => o.keyName == col );
//                   if (mapIndex2 < 0) {
//                     mapKeys.push({ keyName: crationKeys[keyIndex], index: j });
//                   }
//                 }
//               }
//             }
//           });
//           if (vit && vit["Make_Name"] && vit["MODEL_DESC"]) {
//             rawfileData.push(vit);
//           }
//         }
//       });
//     } else {
//       console.log("Empty file uploaded or not able to parse");
//     }
//   } else {
//     if (data && data.length > 0) {
//       await asyncForEach(data, async (row, i) => {
//         if (row && row.length > 1) {
//           let vit = {};
//           await asyncForEach(row, async (col, j) => {
//             if (col != null && col != undefined && col != "") {
//               col = col.toString();
//               let mapIndex = await mapKeys.findIndex((o) => o.index == j);
//               console.log(col, j, mapIndex, mapKeys, rawfileData.length, "tilda");
//               if (mapIndex >= 0) {
//                 vit[mapKeys[mapIndex].keyName] = col;
//               } 
//               else {
//                 let keyIndex = await crationKeys.findIndex((o) => o == col);
//                 if (keyIndex >= 0) {
//                   let mapIndex2 = await mapKeys.findIndex( (o) => o.keyName == col);
//                   if (mapIndex2 < 0) {
//                     mapKeys.push({ keyName: crationKeys[keyIndex], index: j });
//                   }
//                 }
//               }
//             }
//           });
//           if (vit && vit["Make_Name"] && vit["MODEL_DESC"]) {
//             rawfileData.push(vit);
//           }
//         }
//       });
//     } else {
//       console.log("Empty file uploaded or not able to parse");
//     }
//   }
//   if (rawfileData.length > 0) {
//     return rawfileData;
//   } else {
//     console.log("File Data format is not valid");
//     return false;
//   }
// }
// start("MiscDMakeModel_ProdData.xls", "");