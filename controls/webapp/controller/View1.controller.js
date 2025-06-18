sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/Token"
], (Controller, JSONModel, Token) => {
    "use strict";

    return Controller.extend("controls.controller.View1", {
        onInit() {
            const oData = sap.ui.require.toUrl("controls/model/quote.json");
            this.getView().setModel(new JSONModel(oData), "TableModel");

            // const that = this;
            // this.byId("menuFilterCombo1").setItems([
            //     { key: "1", text: "(주)경인양행" },
            //     { key: "2", text: "(주)엘지씨에스" },
            //     { key: "3", text: "address_test_account" },
            //     { key: "4", text: "KPMG" },
            //     { key: "5", text: "LG전자" },
            //     { key: "6", text: "TEST" },
            //     { key: "7", text: "그룹" },
            //     { key: "8", text: "그룹" },
            //     { key: "9", text: "그룹" },
            //     { key: "10", text: "그룹" },
            //     { key: "11", text: "그룹" }
            // ]); 

            //     this.byId("menuFilterCombo2").setItems([
            //     { key: "1", text: "case1" },
            //     { key: "2", text: "case2" },
            //     { key: "3", text: "case3" },
            //     { key: "4", text: "case4" },
            //     { key: "5", text: "case5" },
            //     { key: "6", text: "case6" },
            //     { key: "7", text: "case7" },
            //     { key: "8", text: "case8" },
            //     { key: "9", text: "case9" },
            //     { key: "10", text: "case10" },
            //     { key: "11", text: "case11" }
            // ]);

            // this.byId("multiInput1").setTokens([
            //     new sap.m.Token({ text: "Project Quote", key: "0001" }),
            //     new sap.m.Token({ text: "AMS Quote", key: "0002" }),
            //     new sap.m.Token({ text: "PO Request", key: "0003" })
            // ]);
        
       

            // window.addEventListener("resize", function() {
            //     that._resizeTable();
            // })
        }
        
        // ,onSelectionChange: function () {
        //     var oControl = this.byId("menuFilterCombo");
        //     console.log("Selected Keys:", oControl.getSelectedKeys());
        // }
        // ,onAfterRendering(){
        //     this._resizeTable();
        // }
        // ,_resizeTable(){
        //     const windowHeight = document.getElementById(this.getView().getId()).offsetHeight;
        //     const headerHeight = document.getElementById(this.getView().byId("testbox").getId()).offsetHeight;

        //     const offsetHeight = windowHeight - headerHeight - (windowHeight / 10);
        //     document.getElementById(this.getView().byId("TableBox").getId()).style.height = offsetHeight + "px"
        // }
    });
});