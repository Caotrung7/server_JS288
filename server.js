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

//Tham chieu den thu vien libs/sendMail
const sendMail = require("./libs/sendMail");

//Tham chieu den thu vien upload images
const imgCloud = require("./libs/cloudinaryImages");



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
                    filter = {
                        "Nhom.Ma_so": tmp[1].toUpperCase()
                    };
                }
                if (collectionName != undefined) {
                    db.getAll(collectionName, filter).then((result) => {
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
            //         let newUser = JSON.parse(noi_dung_nhan);
            //         let dsUser = db.collectionNames.dsNguoidung;
            //         db.insertOne(dsUser, newUser)
            //             .then((result) => {
            //                 results = { noiDung: result };

            //                 res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
            //                 res.end(JSON.stringify(results));
            //             })
            //             .catch((error) => {
            //                 console.error("Error inserting user:", error);
            //                 res.writeHead(500, { "Content-Type": "text/plain" });
            //                 res.end("Internal Server Error");
            //             })
            //     })
            if (url == "/ThemDienthoai") {
                req.on('end', function () {
                    let mobile = JSON.parse(noi_dung_nhan);
                    let ket_qua = { "Noi_dung": true };
                    db.insertOne("mobile", mobile).then(result => {
                        console.log(result);
                        res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                        res.end(JSON.stringify(ket_qua));
                    }).catch(err => {
                        console.log(err);
                        ket_qua.Noi_dung = false;
                        res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                        res.end(JSON.stringify(ket_qua));
                    })
                })
            } else if (url == "/Lienhe") {
                req.on("end", () => {
                    let contact = JSON.parse(noi_dung_nhan);
                    let from = "admin@shop288.com";
                    let to = "caotrung1709@gmail.com";
                    let subject = contact.tieude;
                    let body = contact.noidung;

                    results = {
                        noiDung: true
                    };

                    sendMail.Goi_Thu_Lien_he(from, to, subject, body).then((result) => {
                        //console.log(result);
                        res.end(JSON.stringify(results));
                    }).catch((err) => {
                        console.log(err);
                        res.end(JSON.stringify(results));
                    })
                })
            } else if (url == "/Dangnhap") {
                req.on("end", () => {
                    let ket_qua = {
                        "Noi_dung": true
                    }
                    let user = JSON.parse(noi_dung_nhan);
                    let filter = {
                        $and: [
                            { "Ten_Dang_nhap": user.Ten_Dang_nhap },
                            { "Mat_khau": user.Mat_khau }
                        ]
                    }
                    db.getOne("user", filter).then(result => {
                        console.log(result)
                        ket_qua.Noi_dung = {
                            "Ho_ten": result.Ho_ten,
                            "Nhom": {
                                "Ma_so": result.Nhom_Nguoi_dung.Ma_so,
                                "Ten": result.Nhom_Nguoi_dung.Ten
                            }
                        };
                        res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                        res.end(JSON.stringify(ket_qua));

                    }).catch(err => {
                        console.log(err);
                        ket_qua.Noi_dung = false;
                        res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                        res.end(JSON.stringify(ket_qua));
                    })
                })
            } else if (url == "/Dathang") {
                req.on("end", () => {
                    let dsDathang = JSON.parse(noi_dung_nhan);
                    let ket_qua = { "Noi_dung": [] };
                    dsDathang.forEach(item => {
                        let filter = {
                            "Ma_so": item.key
                        }
                        let collectionName = (item.nhom == 1) ? "tivi" : (item.nhom == 2) ? "mobile" : "food";
                        db.getOne(collectionName, filter).then(result => {
                            item.dathang.So_Phieu_Dat = result.Danh_sach_Phieu_Dat.length + 1;
                            result.Danh_sach_Phieu_Dat.push(item.dathang);
                            // Update
                            let capnhat = {
                                $set: { Danh_sach_Phieu_Dat: result.Danh_sach_Phieu_Dat }
                            }
                            let obj = {
                                "Ma_so": result.Ma_so,
                                "Update": true
                            }
                            db.updateOne(collectionName, filter, capnhat).then(result => {
                                if (result.modifiedCount == 0) {
                                    obj.Update = false

                                }
                                ket_qua.Noi_dung.push(obj);
                                console.log(ket_qua.Noi_dung)
                                if (ket_qua.Noi_dung.length == dsDathang.length) {
                                    res.end(JSON.stringify(ket_qua));
                                }
                            }).catch(err => {
                                console.log(err)
                            })
                        }).catch(err => {
                            console.log(err);
                        })

                    })
                })
            } else if (url == "/ImagesDienthoai") {
                req.on('end', function () {
                    let img = JSON.parse(noi_dung_nhan);
                    let Ket_qua = { "Noi_dung": true };

                    // upload img in images of server ------------------------------

                    // let kq = saveMedia(img.name, img.src)
                    // if (kq == "OK") {
                    //     res.writeHead(200, { "Content-Type": "text/json; charset=utf-8" });
                    //     res.end(JSON.stringify(Ket_qua));
                    // } else {
                    //     Ket_qua.Noi_dung = false
                    //     res.writeHead(200, { "Content-Type": "text/json; charset=utf-8" });
                    //     res.end(JSON.stringify(Ket_qua));
                    // }


                    // upload img host cloudinary ------------------------------

                    imgCloud.UPLOAD_CLOUDINARY(img.name, img.src).then(result => {
                        console.log(result);
                        res.end(JSON.stringify(Ket_qua));

                    }).catch(err => {
                        console.log(err);
                        Ket_qua.Noi_dung = false
                        res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                        res.end(JSON.stringify(Ket_qua))
                    })

                })

            } else {
                res.writeHead(404, { "Content-Type": "text/plain" });
                res.end("Not Found");
            }
            break;

        case "PUT":
            // if (url == "/updateUser") {
            //     req.on("end", () => {
            //         let dsUser = db.collectionNames.dsNguoidung;
            //         let updUser = JSON.parse(noi_dung_nhan);
            //         let filter = { "Ma_so": updUser.Ma_so };

            //         db.updateOne(dsUser, filter, { $set: updUser })
            //             .then((result) => {
            //                 results = { noiDung: result };

            //                 res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
            //                 res.end(JSON.stringify(results));
            //             })
            //             .catch((error) => {
            //                 console.error("Error inserting user:", error);
            //                 res.writeHead(500, { "Content-Type": "text/plain" });
            //                 res.end("Internal Server Error");
            //             })
            //     })
            // }
            if (url == "/SuaDienthoai") {
                req.on('end', function () {
                    let mobile = JSON.parse(noi_dung_nhan);
                    let ket_qua = { "Noi_dung": true };
                    db.updateOne("mobile", mobile.condition, mobile.update).then(result => {
                        console.log(result);
                        res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                        res.end(JSON.stringify(ket_qua));
                    }).catch(err => {
                        console.log(err);
                        ket_qua.Noi_dung = false;
                        res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                        res.end(JSON.stringify(ket_qua))
                    })
                })
            } else {
                res.writeHead(404, { "Content-Type": "text/plain" });
                res.end("Not Found");
            }
            break;

        case "DELETE":
            // if (url == "/deleteUser") {
            //     req.on("end", () => {
            //         let delUser = JSON.parse(noi_dung_nhan);
            //         let dsUser = db.collectionNames.dsNguoidung;

            //         db.deleteOne(dsUser, delUser)
            //             .then((result) => {
            //                 results = { noiDung: result };

            //                 res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
            //                 res.end(JSON.stringify(results));
            //             })
            //             .catch((error) => {
            //                 console.error("Error inserting user:", error);
            //                 res.writeHead(500, { "Content-Type": "text/plain" });
            //                 res.end("Internal Server Error");
            //             })
            //     })
            // }
            if (url == "/XoaDienthoai") {
                req.on('end', function () {
                    let mobile = JSON.parse(noi_dung_nhan);
                    let ket_qua = { "Noi_dung": true };
                    db.deleteOne("mobile", mobile).then(result => {
                        console.log(result);
                        res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                        res.end(JSON.stringify(ket_qua));
                    }).catch(err => {
                        console.log(err);
                        ket_qua.Noi_dung = false;
                        res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                        res.end(JSON.stringify(ket_qua))
                    })

                })
            } else {
                res.writeHead(404, { "Content-Type": "text/plain" });
                res.end("Not Found");
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


//Upload media.......................................
function decodeBase64Image(dataString) {
    var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
        response = {};

    if (matches.length !== 3) {
        return new Error('Error ...');
    }

    response.type = matches[1];
    response.data = new Buffer(matches[2], 'base64');

    return response;
}

function saveMedia(Ten, Chuoi_nhi_phan) {
    var Kq = "OK"
    try {
        var Nhi_phan = decodeBase64Image(Chuoi_nhi_phan);
        var Duong_dan = "images//" + Ten
        fs.writeFileSync(Duong_dan, Nhi_phan.data);
    } catch (Loi) {
        Kq = Loi.toString()
    }
    return Kq
}

