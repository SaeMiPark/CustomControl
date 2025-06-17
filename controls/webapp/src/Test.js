sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/Button",
    "sap/m/Popover",
    "sap/m/VBox",
    "sap/m/SearchField",
    "sap/m/List",
    "sap/m/StandardListItem",
    "sap/m/ListMode"
], function (Control, Button, Popover, VBox, SearchField, List, StandardListItem, ListMode) {
    "use strict";

    return Control.extend("controls.src.CustomComboBox", {
        metadata: {
            properties: {
                labelPrefix: { type: "string", defaultValue: "계정" },
                selectedKeys: { type: "string[]", defaultValue: [] }
            },
            events: {
                selectionChange: {},
                clearAll: {}
            }
        },

        init: function () {
            this._aItems = [];
            this._aSelectedKeys = [];

            // 내부 Button 생성
            this._oButton = new Button({
                text: this.getLabelPrefix(),
                icon: "sap-icon://slim-arrow-down",
                press: this._onButtonPress.bind(this)
            });
        },

        setItems: function (aItems) {
            this._aItems = aItems;
            if (this._oList) {
                this._oList.destroyItems();
                this._buildListItems();
            }
        },

        _buildListItems: function () {
            this._aItems.forEach(function (item) {
                var oItem = new StandardListItem({
                    title: item.text,
                    selected: this._aSelectedKeys.includes(item.key),
                    customData: new sap.ui.core.CustomData({
                        key: "key",
                        value: item.key
                    })
                });
                this._oList.addItem(oItem);
            }.bind(this));
        },

        _onButtonPress: function () {
            if (!this._oPopover) {
                this._oList = new List({
                    mode: ListMode.MultiSelect,
                    includeItemInSelection: true,
                    selectionChange: this._onSelectionChange.bind(this)
                });

                this._buildListItems();

                var oSearchField = new SearchField({
                    placeholder: "검색",
                    liveChange: this._onSearch.bind(this)
                });

                var oClearButton = new Button({
                    text: "모두 지우기",
                    type: "Transparent",
                    press: this._onClearAll.bind(this)
                });

                var oVBox = new VBox({
                    items: [oClearButton, oSearchField, this._oList]
                });

                this._oPopover = new Popover({
                    placement: "Bottom",
                    showHeader: false,
                    content: [oVBox]
                });
            }

            this._oPopover.openBy(this._oButton);
        },

        _onSearch: function (oEvent) {
            var sQuery = oEvent.getSource().getValue().toLowerCase();
            var aItems = this._oList.getItems();

            aItems.forEach(function (oItem) {
                var sText = oItem.getTitle().toLowerCase();
                oItem.setVisible(sText.indexOf(sQuery) !== -1);
            });
        },

        _onClearAll: function () {
            this._oList.removeSelections();
            this._aSelectedKeys = [];
            this._updateButtonText();
            this.fireClearAll();
            this.fireSelectionChange();
        },

        _onSelectionChange: function () {
            this._aSelectedKeys = this._oList.getSelectedItems().map(function (oItem) {
                return oItem.getCustomData()[0].getValue();
            });
            this.setProperty("selectedKeys", this._aSelectedKeys, true);
            this._updateButtonText();
            this.fireSelectionChange();
        },

        _updateButtonText: function () {
            var iCount = this._aSelectedKeys.length;
            var sLabel = this.getLabelPrefix();
            this._oButton.setText(iCount > 0 ? sLabel + " (" + iCount + ")" : sLabel);
        },

        setSelectedKeys: function (aKeys) {
            this._aSelectedKeys = aKeys;
            this.setProperty("selectedKeys", aKeys, true);

            if (this._oList) {
                this._oList.getItems().forEach(function (oItem) {
                    var sKey = oItem.getCustomData()[0].getValue();
                    oItem.setSelected(this._aSelectedKeys.includes(sKey));
                }.bind(this));
            }

            this._updateButtonText();
        },

        getSelectedKeys: function () {
            return this._aSelectedKeys;
        },

        setLabelPrefix: function (sLabel) {
            this.setProperty("labelPrefix", sLabel, true);
            this._updateButtonText();
        },

        renderer: function (oRm, oControl) {
            oRm.openStart("div", oControl);
            oRm.class("menuFilterComboBox");
            oRm.openEnd();

            oRm.renderControl(oControl._oButton);

            oRm.close("div");
        }
    });
});