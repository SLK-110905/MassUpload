define("MassUpload/scripts/Main", ["DS/WAFData/WAFData"], function (WAFData) {
    let myWidget = {
        ctx: "VPLMProjectLeader.0000000001.Micro Motion",
        partUrl:
            "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dseng/dseng:EngItem",
        csrfURL:
            "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/application/CSRF?tenant=OI000186152",
        searchUrl:
            "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dseng/dseng:EngItem/search?$searchStr=",
        securityContexturl: "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/modeler/pno/person?current=true&select=collabspaces",
        partwithRevisionUrl: "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/lifecycle/revise/major?tenant=OI000186152&xrequestedwith=xmlhttprequest",
        onLoad: function () {
            document
                .getElementById("importbtn")
                .addEventListener("click", this.importItem);
            document.getElementById("importType").addEventListener("change", function () {
                document.getElementById("status").innerHTML = "";
                const importType = document.getElementById("importType").value;
                const importFileInputsDiv = document.getElementById("importFileInputsDiv");
                if (importType === "part") {
                    importFileInputsDiv.style.display = "none";
                    document.getElementById("downloadtemplate").setAttribute("href", "https://slk-110905.github.io/MassUpload/importPart.csv");
                }
                else if (importType === "specification") {
                    importFileInputsDiv.style.display = "block";
                    document.getElementById("downloadtemplate").setAttribute("href", "https://slk-110905.github.io/MassUpload/importSpec.csv");
                }
                else if (importType === "bom") {
                    importFileInputsDiv.style.display = "none";
                    document.getElementById("downloadtemplate").setAttribute("href", "https://slk-110905.github.io/MassUpload/ebom.csv");
                }
                else if (importType === "partrev") {
                    importFileInputsDiv.style.display = "none";
                    document.getElementById("downloadtemplate").setAttribute("href", "https://slk-110905.github.io/MassUpload/partRev.csv");
                }
            });
            console.log(encodeURIComponent(widget.getValue("ctx")));
            let securitycontextpreference = {
                name: "securitycontext",
                type: "list",
                label: "Security Context",
                options: [],
                defaultValue: encodeURIComponent(widget.getValue("ctx")),
            };
            myWidget.getSecurityContext().then((res) => {
                let collabspaces = res.collabspaces;
                collabspaces.forEach((collabspace) => {
                    let organization = collabspace.name.trim();
                    let couples = collabspace.couples;
                    couples.forEach((couple) => {
                        const SecurityContextStr = couple.role.name + "." + couple.organization.name + "." + organization;
                        securitycontextpreference.options.push({
                            value: SecurityContextStr,
                            label: SecurityContextStr
                        });

                    })
                });
                console.log(JSON.stringify(res));
            });
            console.log(securitycontextpreference);
            widget.addPreference(securitycontextpreference);
        },
        updateWidget: function () {
            alert("Update Widget function called");
        },
        importItem: function (data) {
            console.log("Data Migrating");
            document.getElementById("status").innerHTML = "<br><p>Request Processing </p><br><p>Logs:</p>";
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
                    }
                    else if (importType === "partrev") {
                        const excelFile = document.getElementById("excelFile").files[0];
                        if (excelFile) {
                            console.log("Uploading Part Revision");
                            myWidget.uploadPartWithRevision(csrfTokenName, csrfTokenValue, excelFile)
                        }
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
                                                    document.getElementById("status").innerHTML += `<br>Specification ${title} uploaded successfully`;
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
                            let parentPart = bomInfo[0].trim();
                            let parentPartRev = bomInfo[1].trim();
                            let childPart = bomInfo[2].trim();
                            let childPartRev = bomInfo[3].trim();
                            console.log("Parent Part: ", parentPart);
                            console.log("Parent Part Rev: ", parentPartRev);
                            console.log("Child Part: ", childPart);
                            console.log("Child Part Rev: ", childPartRev);
                            let searchParentStr = parentPart + "(revision:" + parentPartRev + ")";
                            let searchChildPart = childPart + "(revision:" + childPartRev + ")";
                            const searchParentRes = myWidget.searchItem(csrfTokenName, csrfTokenValue, searchParentStr);
                            searchParentRes.then((parentRes) => {
                                console.log("Search Result Parent: ", parentRes);
                                console.log("Res--" + parentRes.member[0]);
                                if (parentRes.member.length > 0 && parentRes.member[0].title === parentPart && parentRes.member[0].revision === parentPartRev) {
                                    console.log("Parent Part Found");
                                    const searchChildRes = myWidget.searchItem(csrfTokenName, csrfTokenValue, searchChildPart);
                                    searchChildRes.then((reschild) => {
                                        console.log("Search Result Child: ", reschild);
                                        console.log(reschild.member[0].title + "==" + childPart);
                                        console.log(reschild.member[0].revision + "==" + childPartRev);
                                        console.log("reschild.member.length--" + reschild.member.length);

                                        if (reschild.member.length > 0 && reschild.member[0].title.trim() == childPart.trim() && reschild.member[0].revision.trim() == childPartRev.trim()) {
                                            console.log("Child Part Found");
                                            const myHeaders = new Object();
                                            myHeaders["Content-Type"] = "application/json";
                                            myHeaders[csrfTokenName] = csrfTokenValue;
                                            myHeaders["SecurityContext"] = myWidget.ctx;
                                            WAFData.authenticatedRequest(myWidget.partUrl + "/locate", {
                                                method: "POST",
                                                headers: myHeaders,
                                                credentials: "include",
                                                timeout: 150000,
                                                type: "json",
                                                data: JSON.stringify({
                                                    "referencedObjects": [
                                                        {
                                                            "source": "https://oi000186152-us1-space.3dexperience.3ds.com/enovia",
                                                            "type": "dseng:EngItem",
                                                            "identifier": reschild.member[0].id,
                                                            "relativePath": "/resources/v1/modeler/dseng/dseng:EngItem/" + reschild.member[0].id
                                                        }
                                                    ]
                                                }),
                                                onComplete: function (expandPartRes, headerRes) {
                                                    let parentObjList = expandPartRes.member[0]["dseng:EngInstance"].member;
                                                    const foundParentId = parentObjList.find((obj) => obj.parentObject.identifier === parentRes.member[0].id);
                                                    console.log("Found Parent Id: ", foundParentId);
                                                    if (!foundParentId) {
                                                        WAFData.authenticatedRequest(`https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dseng/dseng:EngItem/${parentRes.member[0].id}/dseng:EngInstance`, {
                                                            method: "POST",
                                                            headers: myHeaders,
                                                            credentials: "include",
                                                            timeout: 150000,
                                                            type: "json",
                                                            data: JSON.stringify({
                                                                "instances": [
                                                                    {
                                                                        "referencedObject": {
                                                                            "source": "https://oi000186152-us1-space.3dexperience.3ds.com/enovia",
                                                                            "type": "VPMReference",
                                                                            "identifier": reschild.member[0].id,
                                                                            "relativePath": "/resources/v1/modeler/dseng/dseng:EngItem/" + reschild.member[0].id
                                                                        }
                                                                    }
                                                                ]
                                                            }),
                                                            onComplete: function (res, headerRes) {
                                                                console.log(res);
                                                                document.getElementById("status").innerHTML += `<br>Parent Part ${parentPart} and Child Part ${childPart} added to BOM`;
                                                            },
                                                            onFailure(err, errhead) {
                                                                console.log(err);
                                                                document.getElementById("status").innerHTML +=
                                                                    "<br>Failed to add Parent Part and Child Part to BOM: " + JSON.stringify(res);
                                                            },
                                                        });
                                                    }
                                                    else {
                                                        document.getElementById("status").innerHTML += `<br>Parent Part ${parentPart} and Child Part ${childPart} already in connected`;
                                                    }

                                                },
                                                onFailure(err, errhead) {
                                                    console.log(err);
                                                },
                                            });
                                        }
                                        else {
                                            document.getElementById("status").innerHTML += `<br>Child Part ${childPart} not found`;
                                        }
                                    }
                                    )
                                }
                                else {
                                    document.getElementById("status").innerHTML += `<br>Parent Part ${parentPart} not found`;
                                }
                            })
                        }
                    }
                }
                reader.readAsText(file);
            }
        },
        searchItem: function (csrfTokenName, csrfTokenValue, search) {
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
                        resolve(res);
                    },
                    onFailure(err, errhead) {
                        console.log(err);
                        reject(err);
                    },
                });
            })
        },
        getSecurityContext: function (csrfTokenName, csrfTokenValue) {
            console.log("Getting Security Context");
            return new Promise((resolve, reject) => {
                WAFData.authenticatedRequest(myWidget.securityContexturl, {
                    method: "Get",
                    timeout: 1500000,
                    type: "json",
                    onComplete: function (res, headerRes) {
                        console.log("Res--" + res)
                        resolve(res);
                    },
                    onFailure(err, errhead) {
                        console.log(err);
                        reject(err);
                    }
                });
            })
        },
        uploadPartWithRevision: function (csrfTokenName, csrfTokenValue, file) {
            console.log("Importing PartWithRevision");
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const text = e.target.result;
                    const rows = text.split("\n");
                    rows.shift();
                    let revisePartPayload = [];
                    let createPartPayload = [];
                    for (let line of rows) {
                        if (line.trim() != "" || line != undefined) {
                            let part = line.split(",");
                            let partName = part[1].trim();
                            let PartRev = part[2].trim();
                            if (PartRev !== 'AA') {
                                const searchRes = myWidget.searchItem(csrfTokenName, csrfTokenValue, partName + "(revision:AA)");
                                searchRes.then((searchResponse) => {
                                    console.log("Search Result" + JSON.stringify(searchResponse));
                                    if (searchResponse.member.length > 0 && searchResponse.member[0].title.trim() === partName.trim() && searchResponse.member[0].revision.trim() === 'AA') {
                                        console.log("IF Search Result" + JSON.stringify(searchResponse));
                                        document.getElementById("status").innerHTML += `<br>Part ${partName} found`;
                                        revisePartPayload.push({
                                            "physicalid": searchResponse.member[0].id,
                                            "modifiedAttributes": {
                                                "revision": PartRev.trim()
                                            },
                                            "proposedRevision": PartRev.trim()
                                        });
                                    }
                                    else {
                                        document.getElementById("status").innerHTML += `<br>Part ${partName} revision: AA not found`;
                                    }
                                });
                            }
                            else {
                                createPartPayload.push({
                                    type: part[0],
                                    attributes: {
                                        title: part[1],
                                        isManufacturable: part[3].toLowerCase() === "true",
                                        description: part[4],
                                    },
                                });
                            }
                        };
                    }
                    const requestBodyPayload = {
                        items: createPartPayload,
                    };
                    //Revising Part.
                    console.log("Revise Part Payload", revisePartPayload);
                    const revisePart = myWidget.revisePart(csrfTokenName, csrfTokenValue, revisePartPayload);
                    revisePart.then((res) => {
                        console.log(res);
                        document.getElementById("status").innerHTML += `<br>Part ${revisePartPayload} Revision Updated Successfully`;
                    }).catch((err) => {
                        console.log(err);
                    });
                    //Creating Part.
                    console.log("Create Part Payload", createPartPayload);
                    const createPart = myWidget.createPart(csrfTokenName, csrfTokenValue, requestBodyPayload);
                    createPart.then((res) => {
                        console.log(res);
                        document.getElementById("status").innerHTML += `<br>Part ${createPartPayload} Created Successfully`;
                    }).catch((err) => {
                        console.log(err);
                    });

                }
                reader.readAsText(file);
            }

        },
        revisePart: function (csrfTokenName, csrfTokenValue, payload) {
            return new Promise((resolve, reject) => {
                const myHeaders = new Object();
                myHeaders[csrfTokenName] = csrfTokenValue;
                myHeaders["SecurityContext"] = myWidget.ctx;
                WAFData.authenticatedRequest(myWidget.partwithRevisionUrl, {
                    method: "POST",
                    headers: myHeaders,
                    data: JSON.stringify({
                        "data": payload,
                        "folderid": null,
                        "notificationTimeout": 600,
                        "metrics": {
                            "UXName": "Revise",
                            "client_app_domain": "3DEXPERIENCE 3DDashboard",
                            "client_app_name": "ENXENG_AP"
                        }

                    }),
                    credentials: "include",
                    timeout: 150000,
                    type: "json",
                    onComplete: (res, headerRes) => {
                        resolve(res);
                    },
                    onFailure: (err, errheader) => {
                        reject(err);
                        document.getElementById("status").innerHTML +=
                            "<br>Failed to revise Part: " + JSON.stringify(err);
                    }
                });
            });
        },
        createPart: function (csrfTokenName, csrfTokenValue, payload) {
            const myHeaders = new Object();
            myHeaders[csrfTokenName] = csrfTokenValue;
            myHeaders["SecurityContext"] = myWidget.ctx;
            myHeaders["Content-Type"] = "application/json";
            let startTime = Date.now();
            WAFData.authenticatedRequest(myWidget.partUrl, {
                method: "POST",
                headers: myHeaders,
                credentials: "include",
                data: JSON.stringify(payload),
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
        },
    };
    widget.myWidget = myWidget;
    return myWidget;
});
