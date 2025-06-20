sap.ui.define([
    "sap/m/library",
    "sap/ui/core/Control",
    "sap/m/Button",
    "sap/m/BadgeCustomData",
    "sap/m/Popover",
    "sap/m/VBox",
    "sap/m/SearchField",
    "sap/m/List",
    "sap/m/StandardListItem"
], function (Library, Control, Button, BadgeCustomData , Popover, VBox, SearchField, List, StandardListItem) {
    "use strict";

    var FilterComboBox = Control.extend("controls.src.FilterComboBox", {
        metadata: {
            defaultAggregation: "items",
            properties: {
                label: { type: "string", defaultValue: "" },
                selectedKeys: { type: "string[]", defaultValue: [] },
                selectedItems: { type: "object[]", defaultValue: [] }
            },
            aggregations: {
                items: { type: "sap.ui.core.Item", multiple: true, 	singularName: "item", bindable: "bindable" } 
            },
            events: {
                selectionChange: {
                    parameters: {
                        selectedKey: { type: "string" },
                        selectedItem: { type: "object" }
                    }
                },
                clear: {}
            }
        },

        init: function () {
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
                visible: true,
                animation: "None"
            });

            this._oButton.addCustomData(oBadgeData);

            this._oList = new List({
                mode: Library.ListMode.MultiSelect,
                includeItemInSelection: true,
                selectionChange: this._onSelectionChange.bind(this)
            });
        },
        //init시점에 this.getLabel() 반영 안 되어 rendering전에 한번 더 반영
        onBeforeRendering: function () {
            if (this._oButton) {
                this._oButton.setText(this.getLabel()); // 이제는 label이 반영됨
            }
        },

        renderer: function (oRm, oControl) {
            oRm.openStart("span", oControl);
            oRm.openEnd();
            oRm.renderControl(oControl._oButton);
            oRm.close("span");
        }
    });

    /* getter&setter */
    //1. 컨트롤러에서 시작점: aItems -> items데이터 리스트 (controller에서 set)
    //받아온 값 aItems -> this._oList에 addItem으로 set
    FilterComboBox.prototype.setItems = function(aItems){    
        this._setItems(aItems);
    },

    //this._oList의 Item get
    FilterComboBox.prototype.getItems = function () {
        return this._oList ? this._oList.getItems() : [];
    }

    // 동작 X
    // FilterComboBox.prototype.setSelectedItems= function (aItems) {
    //     if (!this._oList) return;
    //     const aKeys = aItems.map(function (oItem) {
    //         const oCustomData = oItem.getCustomData().find(data => data.getKey() === "key");
    //         return oCustomData ? oCustomData.getValue() : null;
    //     }).filter(Boolean);

    //     this.setProperty("selectedItems", aKeys, true);
    // },

    FilterComboBox.prototype.getSelectedItems= function () {
        return this.getProperty("selectedItems");
    },

    // 동작 X
    // FilterComboBox.prototype.setSelectedKeys= function (aKeys) {
    //     this.setProperty("selectedKeys", aKeys, true);

    //     if (this._oList) {
    //         this._oList.getItems().forEach(function (oItem) {
    //             var sKey = oItem.getCustomData()[0].getValue();
    //             oItem.setSelected(this.getProperty("selectedKeys").includes(sKey));
    //         }.bind(this));
    //     }

    //     this._updateButtonNumber();
    // },
 
    FilterComboBox.prototype.getSelectedKeys= function () {
        return this.getProperty("selectedKeys");
    },


    /* 기타 함수 */
    //select에 맞춰 button Number update
    FilterComboBox.prototype._updateButtonNumber= function () {
        var iCount = this.getProperty("selectedKeys").length;

        // 아이콘 표시 여부
        this._oButton.setIcon(iCount > 0 ? "" : "sap-icon://slim-arrow-down");

        // badge CustomData 업데이트
        this._oButton.getBadgeCustomData().setValue(iCount > 0 ? iCount.toString():"");
        

        this._oButton.rerender(); // 강제 갱신
    },
    FilterComboBox.prototype._setItems = function(aItems){
        //매개변수 aItems 있을 때 controller에서 setItems일 때
        if(aItems){
            aItems.forEach(function (item) {
                var oItem = new StandardListItem({
                    title:  item.text,//보이는 값
                    selected: this.getProperty("selectedKeys").includes(item.key),
                    customData:[
                        new sap.ui.core.CustomData({key: "key", value: item.key }), //보이는 값의 data path filter할때 필요..
                        new sap.ui.core.CustomData({key: "value", value: item.text }), 
                        new sap.ui.core.CustomData({key: "label", value: this.getLabel() }) //button 명
                    ] 
                });
                this._oList.addItem(oItem);
            }.bind(this));
        //매개변수 aItems 없을 때 view에서 items랑 core:Item 설정했을 때
        }else{
            aItems =  this.getAggregation("items");
            
            aItems.forEach(function (item) {
                debugger;
                var oItem = new StandardListItem({
                    title:  item.getText(),//보이는 값
                    selected: this.getProperty("selectedKeys").includes(item.key),
                    customData:[
                        new sap.ui.core.CustomData({key: "key", value: item.getKey() }), //보이는 값의 data path filter할때 필요..
                        new sap.ui.core.CustomData({key: "value", value: item.getText() }), 
                        new sap.ui.core.CustomData({key: "label", value: this.getLabel() }) //button 명
                    ] 
                });
                this._oList.addItem(oItem);
            }.bind(this));
            
        }


    },

    /* 이벤트 */
    //버튼 클릭 이벤트
    FilterComboBox.prototype._onButtonPress= function () {
            this._setItems(); //view에서 dataSet했을 경우

            if (!this._oPopover) {
                var oClearButton = new Button({
                    text: "Clear All",
                    icon: "sap-icon://add-filter",
                    type: "Transparent",                    
                    press: this._onClear.bind(this)
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

    //검색 이벤트
    FilterComboBox.prototype._onSearch= function (oEvent) {
            var sQuery = oEvent.getSource().getValue().toLowerCase();
            var aItems = this._oList.getItems();

            aItems.forEach(function (oItem) {
                var sText = oItem.getTitle().toLowerCase();
                oItem.setVisible(sText.indexOf(sQuery) !== -1);
            });
    },

    // clear button press 이벤트
    FilterComboBox.prototype._onClear= function () {
        this._oList.removeSelections();
        this.setProperty("selectedKeys", [], true);
        this.setProperty("selectedItems",[], true);
        this._updateButtonNumber();
        this.fireSelectionChange();
    },

    //체크박스 선택 이벤트
    FilterComboBox.prototype._onSelectionChange= function () {
        /* items */
        // item 배열 생성
        const aSelectedItems = this._oList.getSelectedItems();

        const tempItems = [];
        const tempKeys = [];

        aSelectedItems.forEach(item=>{
            var selectedObject = {
                key : item.getCustomData().find(d => d.getKey() === "key")?.getValue(),
                value : item.getCustomData().find(d => d.getKey() === "value")?.getValue(),
                label : item.getCustomData().find(d => d.getKey() === "label")?.getValue(),
            }
            tempItems.push(selectedObject);
            tempKeys.push(item.getCustomData().find(d => d.getKey() === "key")?.getValue());
        })

        //setProperty
        this.setProperty("selectedItems", tempItems, true);
        this.setProperty("selectedKeys", tempKeys, true);
        
        this._updateButtonNumber();
        //이벤트 parameter는 배열 아님
        this.fireSelectionChange({selectedKey: aSelectedKeys[0],selectedItem: aSelectedItems[0]}); // combobox 변경 event
    }
    

    return FilterComboBox
});