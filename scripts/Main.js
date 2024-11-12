define("MassUpload/scripts/Main", [
    "DS/WAFData/WAFData",
],
    function (WAFData) {
        let myWidget = {
            ctx: "VPLMProjectLeader.0000000001.Micro Motion",
            onLoad: function () {
                alert("widget has been Loaded");
                document.getElementById("importbtn").addEventListener("click", this.importItem);
            },
            updateWidget: function () {

            },
            importItem: function (data) {
                console.log("importing item");
                // URLs
                let csrfURL = "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/application/CSRF?tenant=OI000186152";
                WAFData.authenticatedRequest(csrfURL, {
                    method: "Get",
                    headers: {

                    },
                    data: {

                    },
                    timeout: 150000,
                    type: "json",
                    onComplete: function (res, headerRes) {
                        const csrfTokenName = res.csrf.name;
                        const csrfTokenValue = res.csrf.value;
                        myWidget.uploadPart(csrfTokenName,csrfTokenValue);
                    }
                });
            },
            uploadPart: function (csrfTokenName,csrfTokenValue)
            {
                const importType = document.getElementById("importType").value;
                const file = document.getElementById("importFile").files[0];
                if (importType === "part") {
                    console.log("Importing Part");
                    if (file) {
                        const reader = new FileReader();
                        let parts = [];
                        reader.onload = function (e) {
                            const text = e.target.result;
                            const rows = text.split("\n");
                            rows.shift();
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
                        console.log("csrfToken", csrfTokenValue);
                        console.log("securityContextValues", myWidget.ctx);
                        let partUrl = "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dseng/dseng:EngItem";
                        const securityContextHeader = 'SecurityContext';
                        const myHeaders = new Object();
                        myHeaders[csrfTokenName] = csrfTokenValue;
                        myHeaders[securityContextHeader] = myWidget.ctx;
                        myHeaders["Content-Type"] = "application/json";
                        WAFData.authenticatedRequest(partUrl, {
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
                        reader.readAsText(file)
                        
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
