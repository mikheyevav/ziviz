Ziviz

Exploratory data analysis tool for Jupyter. Ziviz supports both Jupyter lab and notebook. It is based on [Plotly](https://plotly.com) library.


![](ziviz.gif)

Installation
------------
$ pip install ziviz

Usage
-----
from ziviz import ZivizWidget

ZivizWidget(pd.read_csv('https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv'))


