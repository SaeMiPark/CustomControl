sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], (Controller, JSONModel) => {
    "use strict";

    return Controller.extend("controls.controller.View1", {
        onInit() {
            const oData = sap.ui.require.toUrl("controls/model/quote.json");
            this.getView().setModel(new JSONModel(oData), "TableModel");

            const that = this;

            // window.addEventListener("resize", function() {
            //     that._resizeTable();
            // })
        }
        // onAfterRendering(){
        //     this._resizeTable();
        // },
        // _resizeTable(){
        //     const windowHeight = document.getElementById(this.getView().getId()).offsetHeight;
        //     const headerHeight = document.getElementById(this.getView().byId("testbox").getId()).offsetHeight;

        //     const offsetHeight = windowHeight - headerHeight - (windowHeight / 10);
        //     document.getElementById(this.getView().byId("TableBox").getId()).style.height = offsetHeight + "px"
        // },
    });
});