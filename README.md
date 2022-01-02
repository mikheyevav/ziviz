## Ziviz

Exploratory data analysis tool for Jupyter. Ziviz supports both Jupyter lab and notebook. It is based on [Plotly](https://plotly.com) library.


![](ziviz.gif)

Installation
------------
$ pip install ziviz

Usage
-----

```python
from ziviz import ZivizWidget

df = pd.read_csv('https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv')
ZivizWidget(df)
```
