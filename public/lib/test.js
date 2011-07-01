(function() {
  Ext.setup({
    onReady: function() {
      var filtered, list, panel, testStore;
      Ext.Anim.override({
        disableAnimations: true
      });
      Ext.regModel('Test', {
        fields: [
          {
            name: 'id',
            type: 'int'
          }, {
            name: 'num',
            type: 'int'
          }
        ]
      });
      testStore = new Ext.data.Store({
        model: 'Test',
        data: [
          {
            id: 1,
            num: 1
          }, {
            id: 2,
            num: 2
          }, {
            id: 3,
            num: 3
          }
        ]
      });
      filtered = false;
      list = new Ext.List({
        xtype: "list",
        itemTpl: "<h3>{num}</h3>",
        store: testStore
      });
      return panel = new Ext.Panel({
        fullscreen: true,
        defaults: {
          animation: false
        },
        dockedItems: [
          {
            dock: "top",
            xtype: "toolbar",
            items: [
              {
                xtype: "button",
                text: "Filter",
                handler: function() {
                  console.log("Filtered", filtered, "Filters", testStore.filters);
                  testStore.clearFilter();
                  if (!filtered) {
                    testStore.filterBy(function(record) {
                      return record.get('num') > 2;
                    });
                    this.setText("Unfilter");
                  } else {
                    this.setText("Filter");
                  }
                  filtered = !filtered;
                  return list.refresh();
                }
              }, {
                xtype: "button",
                text: "Increment",
                handler: function() {
                  var i, record, _results;
                  _results = [];
                  for (i = 1; i <= 3; i++) {
                    record = testStore.getById(i);
                    console.log("Record", i, record);
                    _results.push(record.set('num', record.get('num') + 1));
                  }
                  return _results;
                }
              }
            ]
          }
        ],
        items: [list]
      });
    }
  });
}).call(this);
