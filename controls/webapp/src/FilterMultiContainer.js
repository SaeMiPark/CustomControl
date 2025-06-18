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
          tokenDelete: this._onTokenDelete.bind(this),
          visible: false
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
        oRm.addClass("FilterMultiContainer");
        oRm.writeClasses();
        oRm.openEnd();

        
        // comboBox div
        oRm.openStart("div", oControl);
        oRm.addClass("FilterMultiComboBox");
        oRm.writeClasses();
        oRm.openEnd();
        const aBoxes = oControl.getAggregation("menuGroups") || [];
        aBoxes.forEach(box => oRm.renderControl(box));
        oRm.close("div");

        // tokenizer
        const oTokenizer = oControl.getAggregation("tokenizer");
        if (oTokenizer) {
          oRm.renderControl(oTokenizer);
        }
        
        oRm.close("div");
        // oRm.write("</div>");
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
          key: sProp+"|"+val,
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
          debugger;
          const aCustomData = item.getAggregation("customData")[0] || []; //index: 0번 path에 대한 data
          const aCustomDataBtn = item.getAggregation("customData")[1] || []; //index: 1번 button명에 대한 data
          const sKey = aCustomData.getValue();
          const sPath=sKey.split("|")[0]
          const sValue = item.getTitle();      
          // ✅ 토큰 생성
          if (sKey && sValue && oTokenizer) {
            const oToken = new Token({ 
              key: sKey, 
              text: aCustomDataBtn.getValue().toUpperCase()+": "+sValue 
            });
            oToken.addStyleClass("token");
            oTokenizer.addToken(oToken);
             oTokenizer.setVisible(true);
          }
          // ✅ 여기까지
          return new Filter(sPath, FilterOperator.Contains, sValue)
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

    let tokenKey = null;
    let tokenValue = null;

    //1. token제거
    aRemovedTokens.forEach(token => {
      tokenKey = token.getKey();
      tokenValue = token.getText();
      // console.log("Deleted token key:", tokenKey); //documentTypeDescription|AMS Quote
      // console.log("Deleted token value:", tokenValue); //AMS Quote

      oTokenizer.removeToken(token); // 해당 Token 제거
    });

    // 2. 삭제 토근 콤보박스 선택 해제 & table filter 해제 반영
    const aBoxes = this.getAggregation("menuGroups") || [];
    aBoxes.forEach(oCombo => {
      debugger;
      const aSelectedKeys = oCombo.getSelectedKeys();

       if (!aSelectedKeys.includes(tokenKey)) return;

      // key 목록에서 해당 key 제거
      const aUpdatedKeys = aSelectedKeys.filter(key => key !== tokenKey);
      // 선택 상태 갱신
      oCombo.setSelectedKeys(aUpdatedKeys);
      //table filter반영
      this._applyFilters();
    });
  };

  return FilterMultiContainer;
});
