define("MassUpload/scripts/Main", ["DS/WAFData/WAFData"], function (WAFData) {
    let myWidget = {
        ctx: "VPLMProjectLeader.0000000001.Micro Motion",
        partUrl:
            "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dseng/dseng:EngItem",
        csrfURL:
            "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/application/CSRF?tenant=OI000186152",
        onLoad: function () {
            document
                .getElementById("importbtn")
                .addEventListener("click", this.importItem);
        },
        updateWidget: function () {
            document
                .getElementById("importbtn")
                .addEventListener("click", this.importItem);
        },
        importItem: function (data) {
            console.log("importing item");
            WAFData.authenticatedRequest(myWidget.csrfURL, {
                method: "Get",
                timeout: 150000,
                type: "json",
                onComplete: function (res, headerRes) {
                    const csrfTokenName = res.csrf.name;
                    const csrfTokenValue = res.csrf.value;
                    const importType = document.getElementById("importType").value;
                    const file = document.getElementById("importFile").files[0];
                    if (importType === "part") {
                        myWidget.uploadPart(csrfTokenName, csrfTokenValue,file);
                    }
                }
            });
        },
        uploadPart: function (csrfTokenName, csrfTokenValue,file) {
            console.log("Importing Part");
            if (file) {
                const reader = new FileReader();
                let parts = [];
                reader.onload = function (e) {
                    const text = e.target.result;
                    const rows = text.split("\n");
                    rows.shift();
                    for (let line of rows) {
                        if(line.trim()!="" || line!=undefined)
                        {
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
                        "<br>Request PayLoad Uploading:" + JSON.stringify(requestBody);
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
                            let minuteTaken=elapsedTime / (1000 * 60);
                            console.log("response", res);
                            document.getElementById("status").innerHTML =
                                "<br><p style='color: red;'>Time Taken(Minutes): "+minuteTaken+"</p>Response : " + JSON.stringify(res);

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
    };
    widget.myWidget = myWidget;
    return myWidget;
});
