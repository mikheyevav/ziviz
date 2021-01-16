var widgets = require('@jupyter-widgets/base');
var $ = require("jquery")
const viz_types = require("./viz_types.js");

let create_selector_from_array = function (ar){
  let s = $('<select>')
  s.addClass("ziviz_observe")
  ar.forEach(
    function(el){
      $("<option>").attr("value",el).html(el).appendTo(s)
    }
  )
  return s
}

let update_header = function (el, model) {
  let axis_list = model.get("axis_options");
  let viz_type_el = $(el).find("[data-ziviz_type='viz_type']")[0];
  let cur_viz_type = viz_type_el.value;
  let available_options = viz_types[cur_viz_type];
  let avail_opts_keys = Array.from(viz_types[cur_viz_type].keys());

  // Remove those that are impossible
  $(el).find("div.ziviz_option_container").each( function() {
    let opt = $(this).find("select").first()[0].dataset.ziviz_type;
    if(!(avail_opts_keys.includes(opt))){
      this.remove();
    }
  });

  // Add those that become possible
  for(var k=0;k<avail_opts_keys.length;k++){
    let opt_name = avail_opts_keys[k];
    let opt_vals = available_options.get(opt_name) ;
    let prev_opt = (k==0? null : avail_opts_keys[k-1] );
    if ($(el).find("[data-ziviz_type='"+opt_name+"']").length==0 ){
      // Create element
      let option_container = $("<div>")
        .addClass("ziviz_option_container")
        .css("display","inline")
        .css("margin-right", "5px")
        .css("margin-top", "2px")
        .css("margin-bottom", "2px")
        .append(opt_name+":");

      var arr= ( (opt_vals==="%axis_selector") ? axis_list : opt_vals )
      var col_selector = create_selector_from_array(arr) 
        .attr("data-ziviz_type", opt_name)
        .on('change', {el:el, model:model}, selection_changed_cb )
        .appendTo(option_container); 
      var prev_el = null;
      if (prev_opt != null){
        prev_el = $(el).find("[data-ziviz_type='"+prev_opt+"']")[0].parentNode;
      }
      prev_el == null ? option_container.prependTo($(el).find(".ziviz_options").first()[0] ) : option_container.insertAfter(prev_el);
    }
  }
}

let selection_changed_cb = function( e ) {
  $(e.data.el).find("div.ziviz_canvas").empty();
  update_header( e.data.el, e.data.model );
  let viz = {"v": Array.from( $(e.data.el).find(".ziviz_observe") , (i) => ({"id":i.dataset.ziviz_type, "val": i.value} ) ) };
  e.data.model.set("viz_params",viz);
  e.data.model.save_changes();
}

let get_source_cb = function( e ) {
  $(e.data.el).find("div.ziviz_canvas")
    .empty()
    .html(e.data.model.get("viz_code"));
}
// This function is called only once on widget initialisation
let get_header_html = function (el, model) {
  let header = $("<div>")
    .addClass("ziviz_header")
    .css("display","block");

  let viz_type = create_selector_from_array(Object.keys(viz_types));
  viz_type.attr("data-ziviz_type", "viz_type")
    .css("margin-right", "5px")
    .appendTo(header)
    .on('change', {el:el, model:model}, selection_changed_cb );
  $("<button>")
    .html("Source code")
    .appendTo(header)
    .on('click', {el:el, model:model}, get_source_cb );

  header.appendTo(el);

  $("<div>")
    .addClass("ziviz_options")
    .css("display","block")
    .appendTo(el);


  update_header( el, model );
  $("<div>")
    .addClass("ziviz_canvas")
    .appendTo(el);
}

var ZivizModel = widgets.DOMWidgetModel.extend({
    defaults: Object.assign(widgets.DOMWidgetModel.prototype.defaults(), {
        _model_name : 'ZivizModel',
        _view_name : 'ZivizView',
        _model_module : 'ziviz',
        _view_module : 'ziviz',
        _model_module_version : '0.1.3',
        _view_module_version : '0.1.3'
    })
});


var ZivizView = widgets.DOMWidgetView.extend({

  render: function() {
    this.model.on('change:plotly_js', this.plotly_js_changed, this);
    // initialise plotly
    // valid values are lab nb
    let v = "";
    if ( typeof global.require == "undefined" ){
      v = typeof global.Plotly == "undefined" ? "lab_inc" : "lab_not_inc" 
    } else {
      v = "nb";
    }
    this.model.set("plotly_js_req", v);
    this.model.save_changes();
  },

  viz_changed: function() {
    let s = this.model.get('viz');
    let canv = $(this.el).find(".ziviz_canvas");
    canv.empty();
    $(s).appendTo( canv );
  },
  plotly_js_changed: function() {
    new Function (this.model.get('plotly_js'))();
    get_header_html(this.el, this.model);
    this.model.on('change:viz', this.viz_changed, this);
  },
});

module.exports = {
    ZivizModel: ZivizModel,
    ZivizView: ZivizView
};
