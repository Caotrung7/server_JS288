//Tham chieu den tap tin bien moi truong .env
require("dotenv").config();


// Tham chiếu đến thư viện http của node
const http = require("http");

// Tham chiếu đến thư viện fs của node
const fs = require("fs");

// Khai báo port cho  server
const port = process.env.PORT;

//Tham chieu den thu vien libs/mongodb
const db = require("./libs/mongoDB");


// Xây dựng Dịch vụ

const server = http.createServer((req, res) => {
    let method = req.method;
    let url = req.url;
    let results = {
        "noiDung": `Service Node JS - Method:${method} - Url:${url}`
    }
    // Cấp quyền
    res.setHeader("Access-Control-Allow-Origin", '*');
    res.setHeader("Access-Control-Allow-Methods", 'PUT, POST, OPTIONS,DELETE');
    res.setHeader("Access-Control-Allow-Credentials", true);
    // Lấy dữ liệu gởi từ client -> server: POST, PUT, DELETE
    let noi_dung_nhan = ``;
    req.on("data", (data) => {
        noi_dung_nhan += data;
    })
    switch (method) {
        case "GET":
            if (url.match("\.png$")) {
                let imagePath = `./images/${url}`;
                if (!fs.existsSync(imagePath)) {
                    imagePath = `./images/noImage.png`;
                }
                let fileStream = fs.createReadStream(imagePath);
                res.writeHead(200, { "Content-Type": "image/png" });
                fileStream.pipe(res);
                return;
            } else {
                //tao bien tam de lay value trong class(JSON) thong qua KEY (dstivi/samsung => NHOM.SAMSUNG)
                let tmp = url.substring(1).split("/") //cat chuoi va lay tu vi tri thu 1 cua chuoi
                let collectionName = db.collectionNames[tmp[0]]
                let filter = {};
                if (tmp.length != 1) {
                    filter={
                        "Nhom.Ma_so":tmp[1].toUpperCase()
                    };
                }
                if (collectionName != undefined) {
                    db.getAll(collectionName,filter).then((result) => {
                        results.noiDung = result;
                        res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                        res.end(JSON.stringify(results));
                    })
                } else {
                    res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                    res.end(JSON.stringify(results));
                }
            }
            break;

        case "POST":
            // if (url == "/insertUser") {
            //     req.on("end", () => {
            //         let userNew = JSON.parse(noi_dung_nhan);
            //         let dsUser = JSON.parse(fs.readFileSync("./data/Nguoi_dung.json", "utf8"));
            //         dsUser.push(userNew);
            //         fs.writeFileSync("./data/Nguoi_dung.json", JSON.stringify(dsUser), "utf8");
            //         results = {
            //             noiDung: true
            //         }
            //         res.end(JSON.stringify(results));
            //     })
            // } else {
            //     res.end(JSON.stringify(results));
            // }
            

            break;

        case "PUT":
            if (url == "/updateUser") {
                req.on("end", () => {
                    let userUpdate = JSON.parse(noi_dung_nhan);
                    let dsUser = JSON.parse(fs.readFileSync("./data/Nguoi_dung.json", "utf8"));
                    let user = dsUser.find(item => item.Ma_so == userUpdate.Ma_so);
                    if (user) {
                        user.Ho_ten = userUpdate.Ho_ten
                        user.Ten_Dang_nhap = userUpdate.Ten_Dang_nhap
                        user.Mat_khau = userUpdate.Mat_khau
                        fs.writeFileSync("./data/Nguoi_dung.json", JSON.stringify(dsUser), "utf8");
                        results = {
                            noiDung: true
                        }
                    } else {
                        results = {
                            noiDung: false
                        }
                    }
                    res.end(JSON.stringify(results));
                })
            } else {
                res.end(JSON.stringify(results));
            }

            break;
        case "DELETE":
            if (url == "/deleteUser") {
                req.on("end", () => {
                    let userUpdate = JSON.parse(noi_dung_nhan);
                    let dsUser = JSON.parse(fs.readFileSync("./data/Nguoi_dung.json", "utf8"));
                    let vtXoa = dsUser.findIndex(item => item.Ma_so == userUpdate.Ma_so);
                    if (vtXoa != -1) {
                        dsUser.splice(vtXoa, 1);
                        fs.writeFileSync("./data/Nguoi_dung.json", JSON.stringify(dsUser), "utf8");
                        results = {
                            noiDung: true
                        }
                    } else {
                        results = {
                            noiDung: false
                        }
                    }
                    res.end(JSON.stringify(results));
                })
            } else {
                res.end(JSON.stringify(results));
            }

            break;
        default:
            res.end(JSON.stringify(results));
            break;
    }

});

server.listen(port, () => {
    console.log(`Service run http://localhost:${port}`);
});

