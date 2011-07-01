Ext.setup
  onReady: ->
    Ext.Anim.override({ disableAnimations: true })
    
    Ext.regModel 'Test',
      fields: [
        { name: 'id', type: 'int' }
        { name: 'num', type: 'int' }
      ]
    
    testStore = new Ext.data.Store
      model: 'Test'
      data: [
        { id: 1, num: 1 }
        { id: 2, num: 2 }
        { id: 3, num: 3 }
      ]
    
    filtered = false
    
    list = new Ext.List
      xtype: "list"
      itemTpl: "<h3>{num}</h3>"
      store: testStore
    
    panel = new Ext.Panel
      fullscreen: true
      defaults:
        animation: false
      dockedItems: [
        dock: "top"
        xtype: "toolbar"
        items: [
            xtype: "button"
            text: "Filter"
            handler: ->
              console.log "Filtered", filtered, "Filters", testStore.filters
              testStore.clearFilter()
              
              unless filtered
                testStore.filterBy (record) ->
                  record.get('num') > 2
                @setText "Unfilter"
              else
                @setText "Filter"
              
              filtered = not filtered
              list.refresh()
          ,
            xtype: "button"
            text: "Increment"
            handler: ->
              for i in [1..3]
                record = testStore.getById(i)
                console.log "Record", i, record
                record.set('num', record.get('num') + 1)
        ]
      ]
      items: [ list ]
