sap.ui.define([
  "sap/ui/core/Control",
  "sap/m/MenuButton",
  "sap/m/Menu",
  "sap/m/MenuItemGroup",
  "sap/m/MenuItem",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator"
], function(Control, MenuButton, Menu, MenuItemGroup, MenuItem, Filter, FilterOperator) {
  "use strict";

  var FilterMultiContainer  = Control.extend("controls.src.FilterMultiComboBox", {
    metadata: {
      properties: {
        prefixTableId: { type: "string" }
      },
      aggregations: {
        menuGroups: { type: "sap.m.MenuItemGroup", multiple: true }
      }
    },

    init: function() {
      this._menuGroupStore = []; // 추가 메타정보 저장용
    },

    onBeforeRendering: function() {
      const oTable = this.getTable();
      if (!oTable || this.modelEventDoneFlag) return;

      oTable.attachEventOnce("updateFinished", () => {
        const tableModelName = oTable.getBindingInfo("items").model;
        const tableModelPath = oTable.getBindingInfo("items").path;
        const oModel = oTable.getModel(tableModelName);
        if (!oModel) return;

        oModel.attachRequestCompleted(() => {
          this.modelEventDoneFlag = true;
          const aData = oModel.getProperty(tableModelPath);
          if (aData) {
            this._menuGroupStore = [];
            this.removeAllAggregation("menuGroups");
            this.renderMenuGroups(aData);
          }
        });
      });
    },

    renderer: function(oRm, oControl) {
      oRm.write("<div");
      oRm.writeControlData(oControl);
      oRm.addClass("FilterMultiComboBox");
      oRm.writeClasses();
      oRm.write(">");

      const aGroupObjs = oControl._menuGroupStore || [];

      aGroupObjs.forEach(obj => {
        const oMenu = new Menu({
          items: [obj.group]
        });

        const oMenuButton = new MenuButton({
          text: obj.label,  // 컬럼 이름 등
          menu: oMenu
        });

        oRm.renderControl(oMenuButton);
      });

      oRm.write("</div>");
    }
  });

  FilterMultiContainer.prototype.getTable = function() {
    return sap.ui.getCore().byId(this.getPrefixTableId());
  };

  FilterMultiContainer.prototype.renderMenuGroups = function(aData) {
    const oTable = this.getTable();
    const copyData = aData;

    oTable.getColumns().forEach(oColumn => {
      const sProp = oColumn.getFilterProperty?.();
      const columnText = oColumn.getHeader().getText?.();

      if (sProp && copyData) {
        const values = copyData.map(n => this.getNestedValue(n, sProp));
        const uniqueList = [...new Set(values)];

        const oGroup = new MenuItemGroup({
          itemSelectionMode: "MultiSelect",
          items: uniqueList.map(val => new MenuItem({
            text: val,
            press: () => this._applyFilters()
          }))
        });

        this._menuGroupStore.push({
          prop: sProp,
          label: columnText,
          group: oGroup
        });

        this.addAggregation("menuGroups", oGroup);
      }
    });
  };

  FilterMultiContainer.prototype.getNestedValue = function(obj, path) {
    const keyList = path.split("/");
    return keyList.reduce((acc, key) => acc && acc[key], obj);
  };

  FilterMultiContainer.prototype._applyFilters = function() {
    const aFilters = [];

    this._menuGroupStore.forEach(obj => {
      const oGroup = obj.group;
      const sProp = obj.prop;

      const aSelectedItems = oGroup.getItems().filter(item => item.getSelected?.());
      if (aSelectedItems.length) {
        const aSubFilters = aSelectedItems.map(item =>
          new Filter(sProp, FilterOperator.Contains, item.getText())
        );
        aFilters.push(new Filter(aSubFilters, false)); // OR 조건
      }
    });

    const oTable = this.getTable();
    const oBinding = oTable.getBinding("items");
    oBinding.filter(aFilters);
  };

  return FilterMultiContainer;
});
