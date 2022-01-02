import ipywidgets as widgets
from traitlets import Unicode, observe, List, Dict

import pandas as pd

import plotly.express as px
from plotly.offline import get_plotlyjs
import plotly.io as pio

import os
import json

### module funcs

def load_viz():
    d = os.path.dirname(os.path.abspath(__file__))
    f = os.path.join(d, "static", "viz_types.json")
    with open(f, 'r') as myfile:
      data=myfile.read()
    obj = json.loads(data)
    commons = obj.pop("_common_options")
    for i in obj.keys():
        if "_common_options" in obj[i]:
            for j in obj[i].pop("_common_options"):
                obj[i][j]=commons[j]

    return obj

def ser_args(d: dict)->str:
    return ", ".join([f"{i}=\"{d[i]}\"" for i in d.keys() if d[i] is not None ])

### init 

viz_types = load_viz()
viz_code_template = "<code>import plotly.express as px<br/>px.{viz_name}(df, {viz_params})</code>"

viz_lookup = {
        "histogram": px.histogram,
        "box": px.box,
        "bar chart": px.bar,
        "line chart": px.line,
        "scatter plot": px.scatter,
        "scatter matrix": px.scatter_matrix,
        "pie chart": px.pie,
        "timeline": px.timeline,
        "S-curve": px.ecdf,
        "heatmap": px.density_heatmap
}

# Main class

@widgets.register
class ZivizWidget(widgets.DOMWidget):
    plotly_js = Unicode("").tag(sync=True)
    plotly_js_req = Unicode("").tag(sync=True)
    axis_options = List().tag(sync=True)
    viz_params = Dict().tag(sync=True)
    viz = Unicode("").tag(sync=True)
    viz_code = Unicode("").tag(sync=True)
    
    """widget versions"""
    _view_name = Unicode('ZivizView').tag(sync=True)
    _model_name = Unicode('ZivizModel').tag(sync=True)
    _view_module = Unicode('ziviz').tag(sync=True)
    _model_module = Unicode('ziviz').tag(sync=True)

    _view_module_version = Unicode('^0.1.5').tag(sync=True)
    _model_module_version = Unicode('^0.1.5').tag(sync=True)

    def __get_val(self, inp: list, t:str, axis=True)->str:
        l = [i["val"] for i in inp if i["id"]==t]
        if len(l)>0:
            if axis:
                if l[0]=="None":
                    return None
                if l[0]=="index":
                    return self.df.index
                return l[0]
            else:
                if t=="color_discrete_sequence" and l[0]!="":
                    return getattr(px.colors.qualitative, l[0])
                return l[0] if l[0]!="" else None
        else:
            return ""

    def __init__(self, arg: pd.DataFrame):
        assert(type(arg)==pd.DataFrame)
        super().__init__()
        self.df = arg
        self.axis_options = ["None", "index"] + list(arg.columns)
        self.inc = {"full_html": False}
   
    def update_df(self, arg: pd.DataFrame):
        self.df = arg
        self.axis_options = ["None", "index"] + list(arg.columns)

    @observe("plotly_js_req")
    def _observe_plotly_js_req(self, change):
        if change["new"]=="nb":
            pio.renderers["notebook"].activate()
            self.inc["include_plotlyjs"]="require" 
            self.plotly_js = " "
        else:
            self.inc["include_plotlyjs"]=False
            if change["new"]=="lab_inc":
                self.plotly_js = get_plotlyjs() 
            else:
                self.plotly_js = " "

    @observe("viz_params")
    def _observe_viz_params(self, change):
        viz_specs = change["new"]["v"]
        v_type = self.__get_val(viz_specs, "viz_type", axis=False)
        args = {}
        for k in viz_types[v_type].keys():
            vals = self.__get_val(viz_specs, k, viz_types[v_type][k]=="%axis_selector") 
            args[k] = vals

        f = viz_lookup[v_type]

        args_str = ser_args(args)
        if v_type=="scatter matrix":
            args["dimensions"]=self.df.columns
            args_str= "dimensions=df.columns, " + args_str

        self.viz = f(self.df, **args ).to_html(**self.inc)
        self.viz_code = viz_code_template.format(viz_name=f.__name__, viz_params=args_str )

        return
