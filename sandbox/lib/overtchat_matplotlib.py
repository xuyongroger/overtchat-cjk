"""Matplotlib backend for sandbox runs: show() saves figures as output files.

Selected with MPLBACKEND=module://overtchat_matplotlib, so ``plt.show()``
produces images instead of opening a window. Figures still open when the
program ends are saved too, unless the code already saved them itself.
"""

import atexit
import glob
import os

import matplotlib
from matplotlib import font_manager
from matplotlib.backend_bases import FigureManagerBase, _Backend
from matplotlib.backends.backend_agg import FigureCanvasAgg
from matplotlib.figure import Figure

_savefig = Figure.savefig


def _register_cjk_fonts() -> None:
    """Add a CJK font matplotlib can actually read to the sans fallback.

    The image's Noto CJK files are TTC/CFF, which matplotlib cannot load;
    Droid Sans Fallback is a plain TrueType CJK font. Registration here is
    independent of the injected matplotlibrc so charts keep working even if
    that file is ever removed.
    """
    added = []
    for path in sorted(glob.glob("/usr/share/fonts/truetype/*/*.ttf")):
        try:
            font_manager.fontManager.addfont(path)
            added.append(font_manager.FontProperties(fname=path).get_name())
        except Exception:
            continue
    if added:
        sans = list(matplotlib.rcParams["font.sans-serif"])
        sans.extend(name for name in added if name not in sans)
        matplotlib.rcParams["font.sans-serif"] = sans


_register_cjk_fonts()


def _savefig_and_remember(self, *args, **kwargs):
    result = _savefig(self, *args, **kwargs)
    self._overtchat_saved = True
    return result


# A figure the code saved with savefig() is already an output; saving it again
# as figure-N.png would return the same chart twice.
Figure.savefig = _savefig_and_remember


def save_open_figures() -> None:
    import matplotlib.pyplot as plt

    directory = os.environ.get("OVERTCHAT_OUTPUT_DIR")
    if not directory:
        return
    for number in plt.get_fignums():
        figure = plt.figure(number)
        if getattr(figure, "_overtchat_saved", False):
            plt.close(figure)
            continue
        index = 1
        while os.path.exists(os.path.join(directory, f"figure-{index}.png")):
            index += 1
        figure.savefig(
            os.path.join(directory, f"figure-{index}.png"),
            dpi=150,
            bbox_inches="tight",
        )
        plt.close(figure)


# Matplotlib registers its own exit hook, which closes every figure, before it
# loads this backend; exit hooks run last-registered first, so this one wins.
atexit.register(save_open_figures)


@_Backend.export
class _OvertChatBackend(_Backend):
    FigureCanvas = FigureCanvasAgg
    FigureManager = FigureManagerBase

    @staticmethod
    def mainloop() -> None:
        save_open_figures()

    @classmethod
    def show(cls, *args, **kwargs) -> None:
        save_open_figures()
