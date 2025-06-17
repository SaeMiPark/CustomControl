sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/Button",
    "sap/m/BadgeCustomData",
    "sap/m/Popover",
    "sap/m/VBox",
    "sap/m/SearchField",
    "sap/m/List",
    "sap/m/StandardListItem",
    "sap/m/ListMode",
    "sap/m/Token"
], function (Control, Button, BadgeCustomData , Popover, VBox, SearchField, List, StandardListItem, ListMode,  Token) {
    "use strict";

    var FilterComboBox = Control.extend("controls.src.FilterComboBox", {
        metadata: {
            properties: {
                label: { type: "string", defaultValue: "Error" },
                selectedKeys: { type: "string[]", defaultValue: [] }
            },
            aggregations: {
                multiInput: { type: "sap.m.MultiInput"}
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
                text: this.getLabel(),
                icon: "sap-icon://slim-arrow-down",
                iconFirst: false, // 아이콘을 텍스트 오른쪽으로 이동
                press: this._onButtonPress.bind(this),
                type: "Transparent",
			    badgeStyle: "Default"
            });

            // CustomData 추가 (Badge)
            var oBadgeData = new BadgeCustomData({
                key: "badge",
                value: "", // 초기값 없음
                visible: true
            });

            this._oButton.addCustomData(oBadgeData);
        },
        //이거때문에 Error라고 떴음.. 이해 필요.
        onBeforeRendering: function () {
            if (this._oButton) {
                this._oButton.setText(this.getLabel()); // 이제는 label이 반영됨
            }
        },

        //1 aItems -> items데이터 리스트
        setItems: function (aItems) {
            this._aItems = aItems;
            if (this._oList) {
                this._oList.destroyItems();
                this._buildListItems();
            }
        },

        getItems: function () {
            return this._oList ? this._oList.getItems() : [];
        },
        //2 데이터 바인딩 _buildListItems
        _buildListItems: function () {
            this._aItems.forEach(function (item) {
                var oItem = new StandardListItem({
                    title:  item.text,//보이는 값
                    selected: this._aSelectedKeys.includes(item.key),
                    customData:[
                        new sap.ui.core.CustomData({key: "path", value: item.key }), //보이는 값의 data path filter할때 필요..
                        new sap.ui.core.CustomData({key: "group", value: this.getLabel() }), //button 명
                    ] 
                });
                this._oList.addItem(oItem);
            }.bind(this));
        },

        //버튼 클릭 이벤트 시작
        _onButtonPress: function () {
            if (!this._oPopover) {
                this._oList = new List({
                    mode: ListMode.MultiSelect,
                    includeItemInSelection: true,
                    selectionChange: this._onSelectionChange.bind(this)
                });
                
                //2 listItem
                this._buildListItems();


                var oClearButton = new Button({
                    text: "Clear All",
                    icon: "sap-icon://add-filter",
                    type: "Transparent",
                    press: this._onClearAll.bind(this)
                });

                // Clear All 버튼 오른쪽 정렬용 HBox
                var oClearRow = new sap.m.HBox({
                    justifyContent: "End", // 오른쪽 정렬
                    items: [oClearButton]
                });

                var oSearchField = new SearchField({
                    placeholder: " ",
                    liveChange: this._onSearch.bind(this),
                });

                
                var oVBox = new VBox({
                    items: [oClearRow, oSearchField, this._oList],
                });

                oVBox.addStyleClass("itemBox");

                this._oPopover = new Popover({
                    placement: "Bottom",
                    showHeader: false,
                    showArrow: false,
                    content: [oVBox]
                });

                this._oPopover.addStyleClass("popover")
            }

            this._oPopover.openBy(this._oButton);
        },
        setSelectedItems: function (aItems) {
            if (!Array.isArray(aItems) || !this._oList) return;

            const aKeys = aItems.map(function (oItem) {
                const oCustomData = oItem.getCustomData().find(data => data.getKey() === "key");
                return oCustomData ? oCustomData.getValue() : null;
            }).filter(Boolean);

            this.setSelectedKeys(aKeys);
        },

        getSelectedItems: function () {
            return this._oList ? this._oList.getSelectedItems() : [];
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

        setSelectedValues: function (aTexts) {
            if (!Array.isArray(aTexts)) return;

            const aKeysToSet = this._aItems
                .filter(item => aTexts.includes(item.text))
                .map(item => item.key);

            this.setSelectedKeys(aKeysToSet);
        },
 
        getSelectedValues: function () {
            if (!this._oList) {
                return [];
            }

            return this._oList.getSelectedItems().map(function (oItem) {
                return oItem.getTitle();
            });
        },

        getTokens: function(){
            if (!this._oList) {
                return [];
            }
            let tokenList = [];

            const aSelectedItems = this._oList.getSelectedItems();

            if (aSelectedItems.length) {
                let oneToken = null;
                aSelectedItems.map(item => {
                    const aCustomData = item.getAggregation("customData")[1] || []; //index 1: button정보
                    oneToken = new Token({text: item.getTitle() , key: aCustomData.getValue()})
                    if(oneToken){
                        tokenList.push(oneToken); 
                    }
                });
                
            }

            return tokenList;

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

        //list 변경 event
        _onSelectionChange: function () {
            this._aSelectedKeys = this._oList.getSelectedItems().map(function (oItem) {
                return oItem.getCustomData()[0].getValue();
            });
            this.setProperty("selectedKeys", this._aSelectedKeys, true);
            this._updateButtonText();
            this.fireSelectionChange(); //combobox 변경 event
        },

        _updateButtonText: function () {
            var iCount = this._aSelectedKeys.length;

            // 아이콘 표시 여부
            this._oButton.setIcon(iCount > 0 ? "" : "sap-icon://slim-arrow-down");

            // badge CustomData 업데이트
            this._oButton.getBadgeCustomData().setValue(iCount > 0 ? iCount.toString():"");
            

            this._oButton.rerender(); // 강제 갱신
        },
    

        renderer: function (oRm, oControl) {
            oRm.openStart("span", oControl);
            // oRm.class("menuFilterComboBox");
            oRm.openEnd();
            oRm.renderControl(oControl._oButton);
            oRm.close("span");
        }
    });
    

    return FilterComboBox
});