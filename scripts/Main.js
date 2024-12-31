define("MassUpload/scripts/Main", ["DS/WAFData/WAFData"], function (WAFData) {
    let myWidget = {
        ctx: "VPLMProjectLeader.0000000001.Micro Motion",
        partUrl:
            "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dseng/dseng:EngItem",
        csrfURL:
            "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/application/CSRF?tenant=OI000186152",
        searchUrl:
            "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dseng/dseng:EngItem/search?$searchStr=",
        onLoad: function () {
            document
                .getElementById("importbtn")
                .addEventListener("click", this.importItem);
            document.getElementById("importType").addEventListener("change", function () {
                const importType = document.getElementById("importType").value;
                const importFileInputsDiv = document.getElementById("importFileInputsDiv");
                if (importType === "specification") {
                    importFileInputsDiv.style.display = "block";
                }
                else {
                    importFileInputsDiv.style.display = "none";
                }
            });

        },
        updateWidget: function () {
            document
                .getElementById("importbtn")
                .addEventListener("click", this.importItem);
        },
        importItem: function (data) {
            console.log("Data Migrating");
            WAFData.authenticatedRequest(myWidget.csrfURL, {
                method: "Get",
                timeout: 150000,
                type: "json",
                onComplete: function (res, headerRes) {
                    const csrfTokenName = res.csrf.name;
                    const csrfTokenValue = res.csrf.value;
                    const importType = document.getElementById("importType").value;
                    const file = document.getElementById("excelFile").files[0];
                    if (importType === "part") {
                        myWidget.uploadPart(csrfTokenName, csrfTokenValue, file);
                    }
                    else if (importType === "specification") {
                        console.log("Inside condition specification)")
                        const excelFile = document.getElementById("excelFile").files[0];
                        const specFiles = document.getElementById("importFiles").files;
                        console.log("excelFile", excelFile);
                        console.log("specFiles", specFiles);
                        if (excelFile && specFiles.length > 0) {
                            console.log("Calling Method UploadSpecification");
                            myWidget.uploadSpecifications(csrfTokenName, csrfTokenValue, excelFile, specFiles)
                        }
                        //myWidget.uploadSpecification(csrfTokenName,csrfTokenValue,files)
                    }
                    else if (importType === "bom") {
                        const excelFile = document.getElementById("excelFile").files[0];
                        if (excelFile) {
                            console.log("Uploading BOM");
                            myWidget.uploadBOM(csrfTokenName, csrfTokenValue, excelFile)
                        }
                        //myWidget.uploadSpecification(csrfTokenName,csrfTokenValue,files)
                    }
                }
            });
        },
        uploadPart: function (csrfTokenName, csrfTokenValue, file) {
            console.log("Importing Part");
            if (file) {
                const reader = new FileReader();
                let parts = [];
                reader.onload = function (e) {
                    const text = e.target.result;
                    const rows = text.split("\n");
                    rows.shift();
                    for (let line of rows) {
                        if (line.trim() != "" || line != undefined) {
                            let part = line.split(",");
                            parts.push({
                                type: part[0],
                                attributes: {
                                    title: part[1],
                                    isManufacturable: part[2].toLowerCase() === "true",
                                    description: part[3],
                                },
                            });
                        }
                    }
                    const requestBody = {
                        items: parts,
                    };
                    console.log(requestBody);
                    document.getElementById("status").innerHTML =
                        "<br><p>Request PayLoad Uploading:" + JSON.stringify(requestBody) + "</p>";
                    console.log("csrfToken", csrfTokenValue);
                    console.log("securityContextValues", myWidget.ctx);
                    const securityContextHeader = "SecurityContext";
                    const myHeaders = new Object();
                    myHeaders[csrfTokenName] = csrfTokenValue;
                    myHeaders[securityContextHeader] = myWidget.ctx;
                    myHeaders["Content-Type"] = "application/json";
                    let startTime = Date.now();
                    WAFData.authenticatedRequest(myWidget.partUrl, {
                        method: "POST",
                        headers: myHeaders,
                        credentials: "include",
                        data: JSON.stringify(requestBody),
                        timeout: 1500000000,
                        type: "json",
                        onComplete: function (res, headerRes) {
                            let endTime = Date.now();
                            let elapsedTime = endTime - startTime;
                            let minuteTaken = elapsedTime / (1000 * 60);
                            console.log("response", res);
                            document.getElementById("status").innerHTML =
                                "<br><p style='color: red;'>Time Taken(Minutes): " + minuteTaken + "</p><p>Response : " + JSON.stringify(res) + "</p>";
                        },
                        onFailure(err, errhead) {
                            console.log(err);
                            document.getElementById("status").innerHTML =
                                "<br>Failed to Upload: " + JSON.stringify(res);
                        },
                    });
                };
                reader.readAsText(file);
            }
        },
        uploadSpecifications: function (csrfTokenName, csrfTokenValue, excelFile, specFiles) {
            let startTime = Date.now();
            console.log("Inside Upload Specification");
            console.log("Specification Files: ", specFiles);
            const reader = new FileReader();
            reader.onload = function (e) {
                const text = e.target.result;
                const rows = text.split("\n");
                rows.shift();
                console.log(rows.length)
                for (let line of rows) {
                    console.log("Line: ", line);
                    if (line.trim() != "" || line != undefined) {
                        let specInfo = line.split(",");
                        let title = specInfo[0].trim();
                        let description = specInfo[1].trim();
                        let specFileName = specInfo[2].trim();
                        console.log("Title: ", title);
                        console.log("Description: ", description);
                        console.log("SpecFileName: ", specFileName);
                        
                        let specFile = Array.from(specFiles).find((file) => file.name === specFileName);

                        console.log(specFile);
                        if (specFile) {
                            //getting checkinTicket
                            const myHeaders = new Object();
                            myHeaders[csrfTokenName] = csrfTokenValue;
                            myHeaders["SecurityContext"] = myWidget.ctx;
                            //myHeaders["Content-Type"] = "application/json";
                            WAFData.authenticatedRequest("https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/documents/files/CheckinTicket", {
                                method: "PUT",
                                headers: myHeaders,
                                credentials: "include",
                                timeout: 150000,
                                type: "json",
                                onComplete: function (res, headerRes) {
                                    console.log("Response : ", res);
                                    const formData = new FormData();
                                    formData.append("__fcs__jobTicket", res.data[0].dataelements.ticket);
                                    formData.append("file_0", specFile);
                                    WAFData.proxifiedRequest("https://stg001us1-dfcs.3dexperience.3ds.com/fcs/servlet/fcs/checkin", {
                                        method: "POST",
                                        credentials: "include",
                                        timeout: 150000000,
                                        headers: myHeaders,
                                        data: formData,
                                        onComplete: function (resFcsCheckin, resFcsHeaders) {
                                            console.log(resFcsCheckin);
                                            const DocumentRequestBody = {
                                                "data": [
                                                    {
                                                        "dataelements": {
                                                            "title": title,
                                                            "description": description,
                                                        },
                                                        "relateddata": {
                                                            "files": [
                                                                {
                                                                    "dataelements": {
                                                                        "title": specFile.name,
                                                                        "receipt": resFcsCheckin
                                                                    },
                                                                    "updateAction": "CREATE"
                                                                }
                                                            ]
                                                        }
                                                    }
                                                ]
                                            }
                                            myHeaders["Content-Type"] = "application/json";
                                            WAFData.authenticatedRequest("https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/documents", {
                                                method: "POST",
                                                headers: myHeaders,
                                                credentials: "include",
                                                data: JSON.stringify(DocumentRequestBody),
                                                timeout: 1500000000000,
                                                type: "json",
                                                onComplete: function (finalRes, headerRes) {
                                                    console.log("Final Response", finalRes.data);
                                                    document.getElementById("status").innerHTML +=`<br>Specification ${title} uploaded successfully`;
                                                },
                                                onFailure(err, errhead) {
                                                    console.log(err);
                                                    document.getElementById("status").innerHTML +=
                                                        "<br>Failed to upload Specification: " + JSON.stringify(res);
                                                },
                                            });
                                        },
                                        onFailure: function (err, errheader) {
                                            document.getElementById("status").innerHTML +=
                                                "<br>Failed to get fcs ticket: " + JSON.stringify(res);
                                        }
                                    })
                                },
                                onFailure(err, errhead) {
                                    console.log(err);
                                    document.getElementById("status").innerHTML +=
                                        "<br>Failed to get Checkin Ticket: " + JSON.stringify(res);
                                },
                            });
                        }
                    }
                }
            };
            reader.readAsText(excelFile);
        },
        uploadBOM: function (csrfTokenName, csrfTokenValue, file) {
            console.log("Importing BOM");
            if (file) {
                const reader = new FileReader();
                let bom = [];
                reader.onload = function (e) {
                    const text = e.target.result;
                    const rows = text.split("\n");
                    rows.shift();
                    for (let line of rows) {
                        if (line.trim() != "" || line != undefined) {
                            let bomInfo = line.split(",");
                            let parentPart=bomInfo[0];
                            let childPart=bomInfo[1];
                            console.log("Parent Part: ", parentPart);
                            console.log("Child Part: ", childPart);
                            const searchParentRes=myWidget.searchItem(csrfTokenName,csrfTokenValue,parentPart);
                            const searchChildRes=myWidget.searchItem(csrfTokenName,csrfTokenValue,childPart);
                            searchParentRes.then((res)=>{
                                console.log("Search Result: ",res);
                                console.log("Res--"+res.member[0]);
                                if(res.member.length>0 && res.member[0].title===parentPart)
                                {
                                    console.log("Parent Part Found");
                                    searchChildRes.then((reschild)=>{
                                        console.log("Search Result: ",reschild);
                                        if(reschild.member.length>0 && reschild.member[0].title===childPart)
                                        {
                                            WAFData.authenticatedRequest(partUrl+"/locate", {
                                                method: "GET",
                                                headers: myHeaders,
                                                credentials: "include",
                                                timeout: 150000,
                                                type: "json",
                                                data:JSON.stringify({
                                                    "referencedObjects": [
                                                        {
                                                            "source": "https://oi000186152-us1-space.3dexperience.3ds.com",
                                                            "type": "dseng:EngItem",
                                                            "identifier": reschild.member[0].id,
                                                            "relativePath": "/resources/v1/modeler/dseng/dseng:EngItem/"+reschild.member[0].id
                                                        }
                                                    ]
                                                }),
                                                onComplete: function (expandPartRes, headerRes) {
                                                    console.log("expandPartRes"+expandPartRes);
                                                },
                                                onFailure(err, errhead) {
                                                    console.log(err);
                                                },
                                            });
                                        }
                                    }
                                )
                                }
                            })
                        }
                    }
                }
                reader.readAsText(file);
            }
        },
        searchItem: function (csrfTokenName,csrfTokenValue,search) {
            console.log("Searching Item");
            return new Promise((resolve, reject) => {
            const searchUrl = myWidget.searchUrl + search;
            const myHeaders = new Object();
            myHeaders[csrfTokenName] = csrfTokenValue;
            myHeaders["SecurityContext"] = myWidget.ctx;
            WAFData.authenticatedRequest(searchUrl, {
                method: "GET",
                headers: myHeaders,
                credentials: "include",
                timeout: 150000,
                type: "json",
                onComplete: function (res, headerRes) {
                    console.log(res);
                    resolve(res);
                },
                onFailure(err, errhead) {
                    console.log(err);
                    reject(err);
                },
            });
        })},
    };
    widget.myWidget = myWidget;
    return myWidget;
});