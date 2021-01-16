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
    return obj

def ser_args(d: dict)->str:
    return ", ".join([f"{i}=\"{d[i]}\"" for i in d.keys() if d[i] is not None ])

### init 

viz_types = load_viz()

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

    _view_module_version = Unicode('^0.1.3').tag(sync=True)
    _model_module_version = Unicode('^0.1.3').tag(sync=True)


    def __init__(self, arg):
        assert(type(arg)==pd.DataFrame)
        super().__init__()
        self.df = arg
        self.axis_options = ["None", "index"] + list(arg.columns)
        self.inc = {"full_html": False}
        self.viz_code_template = "<code>import plotly.express as px<br/>px.{viz_name}(df, {viz_params})</code>"

    def get_val(self, inp: list, t:str, axis=True)->str:
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
        v_type = self.get_val(viz_specs, "viz_type", axis=False)
        args = {}
        for k in viz_types[v_type].keys():
            vals = self.get_val(viz_specs, k, viz_types[v_type][k]=="%axis_selector") 
            args[k] = vals

        if v_type=="histogram":
            self.viz = px.histogram(self.df, **args ).to_html(**self.inc)
            self.viz_code = self.viz_code_template.format(viz_name="histogram", viz_params=ser_args(args) )
            return
        if v_type=="bar chart":
            self.viz = px.bar(self.df, **args ).to_html(**self.inc)
            self.viz_code = self.viz_code_template.format(viz_name="bar", viz_params=ser_args(args) )
            return
        if v_type=="line chart":
            self.viz = px.line(self.df, **args ).to_html(**self.inc)
            self.viz_code = self.viz_code_template.format(viz_name="line", viz_params=ser_args(args) )
            return
        if v_type=="scatter plot":
            self.viz = px.scatter(self.df, **args ).to_html(**self.inc)
            self.viz_code = self.viz_code_template.format(viz_name="scatter", viz_params=ser_args(args) )
            return
        if v_type=="scatter matrix":
            self.viz = px.scatter_matrix(self.df, dimensions=self.df.columns, **args ).to_html(**self.inc)
            self.viz_code = self.viz_code_template.format(viz_name="scatter_matrix", viz_params="dimensions=df.columns, " + ser_args(args) )
            return
        if v_type=="pie chart":
            self.viz = px.pie(self.df, **args ).to_html(**self.inc)
            self.viz_code = self.viz_code_template.format(viz_name="pie", viz_params=ser_args(args) )
            return
        if v_type=="timeline":
            self.viz = px.timeline(self.df, **args ).to_html(**self.inc)
            self.viz_code = self.viz_code_template.format(viz_name="timeline", viz_params=ser_args(args) )
            return
