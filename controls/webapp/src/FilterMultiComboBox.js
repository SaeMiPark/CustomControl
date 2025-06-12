sap.ui.define([
  "sap/ui/core/Control",
  "sap/m/MultiComboBox",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator"
], function(Control, MultiComboBox, Filter, FilterOperator) {
  "use strict";

  var FilterMultiComboBox  = Control.extend("controls.src.FilterMultiComboBox", {
      metadata: {
        properties: {
          prefixTableId: { type: "string" } // 바인딩할 테이블의 ID
        },
        aggregations: {
          comboBox: { type: "sap.m.MultiComboBox", multiple: true }
        }
      },

      init: function() {


      },

      onAfterRendering: function() {
        const oTable = this.getTable();
        if (!oTable) return;


        oTable.attachEventOnce("updateFinished", () => {    // 테이블이 데이터까지 렌더링된 후 한 번 실행
          const tableModelName = oTable.getBindingInfo("items").model;
          const oModel = oTable.getModel(tableModelName);
          if (!oModel) return;

          oModel.attachRequestCompleted(() => {
            const aData = oModel.getProperty("/value");
            if(aData){
              this._renderComboBoxes(aData);
              // this._aDataCache = aData;
              this.invalidate(); // 재 렌더링
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

          const aCombos = oControl.getAggregation("comboBox") || [];
          aCombos.forEach(oCombo => {
            oRm.renderControl(oCombo);
          });
          oRm.write("</div>");
  
      }
  });

  //함수정의
  FilterMultiComboBox.prototype.getTable = function() {
		return sap.ui.getCore().byId(this.getPrefixTableId());
	};

  FilterMultiComboBox.prototype._renderComboBoxes = function (aData) {
          const oTable = this.getTable();
          const oBinding = oTable.getBinding("items");
          const copyData = aData;

          oTable.getColumns().forEach((oColumn) => {
            let sProp = oColumn.getFilterProperty?.();
            if (sProp && copyData) { //'owner/partyName'
              // 1. 해당 컬럼 값만 추출
              var comboBoxDataList=[];
              copyData.forEach(n=>{
                  const value = this.getNestedValue(n, sProp);
                  comboBoxDataList.push(value)
              })

              //2. 중복 제거
              const uniqueList = [...new Set(comboBoxDataList)];

              //3. ComboBox 생성 (change 이벤트 없이)
              const oCombo = new MultiComboBox({
                placeholder: `Values of ${sProp}`,
                width: "200px",
                items: uniqueList.map(val => new sap.ui.core.Item({
                  key: val,
                  text: val
                })),
                change: (oEvent)=>{
                  this._applyFilters();
                }
              });

              //4. Aggregation에 추가 (렌더러에서 표시 예정)
              // this.getAggregation("comboBox");
              debugger;
              this.addAggregation("comboBox", oCombo);
            }
      });

  
  };

  FilterMultiComboBox.prototype.getNestedValue = function (obj, path) { //path == 'owner/partyName'
    const keyList = path.split("/");
    return keyList.reduce((acc, key) => acc && acc[key], obj);

  };

  return FilterMultiComboBox
});
