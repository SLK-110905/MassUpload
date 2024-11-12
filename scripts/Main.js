define("MassUpload/scripts/Main", [
    "DS/WAFData/WAFData",
],
    function (WAFData) {
        let myWidget = {
            ctx: "VPLMProjectLeader.0000000001.Micro Motion",
            onLoad: function () {
                alert("widget has been Loaded");
                this.getCSRFToken();
                console.log("csrfToken"+this.csrfToken);
                document.getElementById("importbtn").addEventListener("click", this.uploadPart);
            },
            updateWidget: function () {t

            },
            getCSRFToken: function (data) {
                // URLs
                let csrfURL = "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/application/CSRF?tenant=OI000186152"
                let createPartUrl = "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dseng/dseng:EngItem/";

                WAFData.proxifiedRequest(csrfURL, {
                    method: "Get",
                    headers: {

                    },
                    data: {

                    },
                    timeout: 150000,
                    type: "json",
                    onComplete: function (res, headerRes) {
                        const csrfToken = res.csrf.name;
                        const csrfValue = res.csrf.value;
                        myWidget.csrfToken = csrfValue;
                        myWidget.csrfTokenName = csrfToken;
                        myWidget.securityContextValue = securityContextValue;
                        console.log("widget--"+widget)
                    }
                });
            },
            uploadPart: function ()
            {
                const importType = document.getElementById("importType").value;
                const file = document.getElementById("importFile").files[0];
                if (importType === "part") {
                    console.log("Importing Part");
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = function (e) {
                            const text = e.target.result;
                            const rows = text.split("\n");
                            rows.shift();
                            let parts = [];
                            for (let line of rows) {
                                let part = line.split(',');
                                parts.push({
                                    type: part[0],
                                    attributes:{
                                        title: part[1],
                                        isManufacturable:part[2].toLowerCase() === 'true',
                                        description:part[3],
                                    }
                                });
                            }
                            const requestBody={
                                items: parts
                            }
                            console.log(requestBody);
                            document.getElementById("status").innerHTML = "Uploading"+JSON.stringify(requestBody);
                            console.log("csrfToken", myWidget.csrfToken);
                            console.log("securityContextValues", myWidget.ctx);
                            let partUrl = "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dseng/dseng:EngItem";
                            const securityContextHeader = 'SecurityContext';
                            const myHeaders = new Object();
                            myHeaders[myWidget.csrfTokenName] = myWidget.csrfToken;
                            myHeaders[securityContextHeader] = myWidget.ctx;
                            myHeaders["Content-Type"] = "application/json";
                            WAFData.proxifiedRequest(partUrl, {
                                method: "POST",
                                headers: myHeaders,
                                credentials: 'include',
                                data: JSON.stringify(requestBody),
                                timeout: 150000,
                                type: "json",
                                onComplete: function (res, headerRes) {
                                    console.log("response", res);
                                    document.getElementById("status").innerHTML = "Uploaded"+JSON.stringify(res);
                                },
                                onFailure(err, errhead) {
                                    console.log(err);
                                }
                                
                            });

                        };
                        reader.readAsText(file);
                    }
                }
                if(importType === "bom"){
                    console.log("import bom");
                }
                
            }
        }
        widget.myWidget = myWidget;
        return myWidget;
    });
