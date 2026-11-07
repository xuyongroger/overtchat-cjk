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


_DROID_GLOB = "/usr/share/fonts/truetype/droid/*.ttf"
_cjk_families: list[str] = []


def _register_cjk_fonts() -> None:
    """Add a CJK font matplotlib can actually read to the sans fallback.

    The image's Noto CJK files are TTC/CFF; Droid Sans Fallback is a plain
    TrueType CJK font. Registration here is independent of the injected
    matplotlibrc so charts keep working even if that file is ever removed.
    """
    for path in sorted(glob.glob(_DROID_GLOB)):
        try:
            font_manager.fontManager.addfont(path)
            name = font_manager.FontProperties(fname=path).get_name()
            if name not in _cjk_families:
                _cjk_families.append(name)
        except Exception:
            continue
    if _cjk_families:
        sans = list(matplotlib.rcParams["font.sans-serif"])
        sans.extend(name for name in _cjk_families if name not in sans)
        matplotlib.rcParams["font.sans-serif"] = sans


_register_cjk_fonts()


def _use_cjk_fallback(fig: Figure) -> None:
    """Append the CJK font families to every text artist before saving.

    Setting rcParams proved unreliable in runs (draws kept resolving the
    default sans list), so each figure carries the fallback explicitly.
    """
    from matplotlib.text import Text

    if not _cjk_families:
        return
    for artist in fig.findobj(Text):
        families = artist.get_fontfamily()
        if any(name in families for name in _cjk_families):
            continue
        artist.set_fontfamily([*families, *_cjk_families])


def _savefig_and_remember(self, *args, **kwargs):
    _use_cjk_fallback(self)
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
