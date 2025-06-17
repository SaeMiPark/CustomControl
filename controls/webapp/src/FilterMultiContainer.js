sap.ui.define([
  "sap/ui/core/Control",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "controls/src/FilterComboBox",
  "sap/m/library",
  "sap/m/Tokenizer",
  "sap/m/Token"
], function(Control, Filter, FilterOperator, FilterComboBox, Library, Tokenizer, Token) {
  "use strict";

  var FilterMultiContainer  = Control.extend("controls.src.FilterMultiComboBox", {
    metadata: {
      properties: {
        prefixTableId: { type: "string" }
      },
      aggregations: {
        menuGroups: { type: "controls.src.FilterComboBox" },
        tokenizer: { type: "sap.m.Tokenizer", multiple: false } 
      }
    },

    init: function() {
        const oTokenizer = new Tokenizer({
          width: "100%",
          tokenDelete: this._onTokenDelete.bind(this)
        });
        this.setAggregation("tokenizer", oTokenizer);
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
            this.removeAllAggregation("menuGroups");
            this.renderMenuGroups(aData);
          }
        });
      });
    },

    renderer: function(oRm, oControl) {
        oRm.openStart("div", oControl);
        oRm.addClass("FilterMultiComboBox");
        oRm.writeClasses();
        oRm.openEnd();
        // const aGroupObjs = oControl._menuGroupStore || [];
        const aBoxes = oControl.getAggregation("menuGroups") || [];
        aBoxes.forEach(box => oRm.renderControl(box));

        const oTokenizer = oControl.getAggregation("tokenizer");
        if (oTokenizer) {
          oRm.renderControl(oTokenizer);
        }
        
        oRm.close("div");
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

        const oGroup = new FilterComboBox({
          label: columnText,
          selectedKeys: [],
          selectionChange: this._applyFilters.bind(this)
        });


        oGroup.setItems(uniqueList.map(val => ({
          key: sProp,
          text: val
        })));
        

        this.addAggregation("menuGroups", oGroup);
      }
    });
  };

  FilterMultiContainer.prototype.getNestedValue = function(obj, path) {
    const keyList = path.split("/");
    return keyList.reduce((acc, key) => acc && acc[key], obj);
  };

  FilterMultiContainer.prototype._applyFilters = function(oControl) {
    const aFilters = [];

    // 모든 FilterComboBox를 순회하며 필터 수집
    const aBoxes = this.getAggregation("menuGroups") || [];
    const oTokenizer = this.getAggregation("tokenizer");
    if (oTokenizer) {
      oTokenizer.removeAllTokens(); // 기존 토큰 초기화
    }


    aBoxes.forEach(oCombo => {
      let aSubFilters=null;
      const aSelectedItems = oCombo.getSelectedItems();

      if (aSelectedItems.length) {
        const aSubFilters = aSelectedItems.map(item => {
          const aCustomData = item.getAggregation("customData")[0] || []; //0번 path에 대한 data
          const sKey = aCustomData.getValue();
          const sValue = item.getTitle();      
          // ✅ 토큰 생성
          if (sKey && sValue && oTokenizer) {
            const oToken = new Token({ 
              key: sKey, 
              text: sValue 
            });
            oTokenizer.addToken(oToken);
          }
          // ✅ 여기까지
          return new Filter(sKey, FilterOperator.Contains, sValue)
        });
        aFilters.push(new Filter(aSubFilters, false)); 
      }    
    });

    const oTable = this.getTable();
    const oBinding = oTable.getBinding("items");
    oBinding.filter(aFilters);
  };

  FilterMultiContainer.prototype._onTokenDelete = function(oControl) {
   
    const oTokenizer = this.getAggregation("tokenizer");
    const aRemovedTokens = oControl.getParameter("tokens");

    //1. token제거
    aRemovedTokens.forEach(token => {
      const sKey = token.getKey();
      const sValue = token.getText();
      console.log("Deleted token key:", sKey);
      console.log("Deleted token key:", sValue);

      oTokenizer.removeToken(token); // 해당 Token 제거
    });

    // 2. 모든 ComboBox에서 해당 key를 제거
    const aBoxes = this.getAggregation("menuGroups") || [];
    aBoxes.forEach(oCombo => {
      debugger;

      const aSelectedKeys = oCombo.getSelectedKeys();

      if(!aSelectedKeys){
        return;
      }

      //다시시작지점
      // const iIndex = aSelectedKeys.indexOf(sKey);

      // if (iIndex > -1) {
      //   aSelectedKeys.splice(iIndex, 1); // 해당 key 제거
      //   oCombo.setSelectedKeys(aSelectedKeys); // 변경된 selectedKeys로 갱신
      // }
    });
  };

  return FilterMultiContainer;
});
