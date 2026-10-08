import numpy as np, json, sys, soundfile as sf
from scipy.signal import butter, sosfilt
SR = 48000
rng = np.random.default_rng(3)
def env(n, a, d):  # attack / exp decay (seconds)
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def kick():
    n = int(.45 * SR); t = np.arange(n) / SR
    f = 48 + 110 * np.exp(-t / .035); ph = 2 * np.pi * np.cumsum(f) / SR
    click = hp(rng.standard_normal(n), 2000) * env(n, .0005, .004) * .25
    return (np.sin(ph) * env(n, .001, .16) + click) * .95
def clap():
    n = int(.3 * SR); x = bp(rng.standard_normal(n), 900, 2600) ; e = np.zeros(n)
    for d in (0, .011, .022): i = int(d * SR); e[i:] += env(n - i, .0005, .012 if d < .02 else .12)
    return x * e * .55
def hat(open_=False):
    n = int((.25 if open_ else .06) * SR); return hp(rng.standard_normal(n), 7000) * env(n, .0005, .09 if open_ else .018) * .22
def tone(freq, dur, kind='saw', vol=.3, dec=None):
    n = int(dur * SR); t = np.arange(n) / SR
    if kind == 'saw': x = sum(np.sin(2 * np.pi * freq * k * t) / k for k in range(1, 9))
    elif kind == 'sq': x = sum(np.sin(2 * np.pi * freq * k * t) / k for k in range(1, 10, 2))
    else: x = np.sin(2 * np.pi * freq * t)
    e = env(n, .004, dec) if dec else np.minimum(1, t / .01) * np.minimum(1, (dur - t) / .03)
    return x * e * vol
def add(buf, x, at, g=1.0):
    i = int(at * SR)
    if i >= len(buf): return
    j = min(len(buf), i + len(x)); buf[i:j] += x[:j - i] * g

def music(dur, bpm=128):
    buf = np.zeros(int((dur + 1) * SR)); beat = 60 / bpm
    prog = [(45, [57, 60, 64]), (41, [53, 57, 60]), (48, [55, 60, 64]), (43, [55, 59, 62])]  # Am F C G (midi)
    mf = lambda m: 440 * 2 ** ((m - 69) / 12)
    nb = int(dur / beat) + 2
    for b in range(nb):
        t = b * beat; bar = b // 4; root, chord = prog[bar % 4]
        intro = b < 4
        add(buf, kick(), t, .9 if not intro else .7)
        if b % 2 == 1 and not intro: add(buf, clap(), t)
        add(buf, hat(), t + beat / 2); 
        if not intro: add(buf, hat(), t + beat / 4, .5); add(buf, hat(), t + 3 * beat / 4, .5)
        # off-beat bass pump
        add(buf, lp(tone(mf(root), beat * .45, 'saw', .32), 600), t + beat / 2)
        if b % 4 == 0:
            for m in chord: add(buf, lp(tone(mf(m + 12), beat * 4, 'sq', .05), 2400), t)
        # little pluck melody, 16ths on some beats
        if not intro and b % 2 == 0:
            for k, m in enumerate([chord[2] + 12, chord[1] + 12, chord[0] + 24, chord[1] + 12]):
                add(buf, tone(mf(m), .16, 'sq', .045, dec=.07), t + k * beat / 4)
    return buf

def sfx(dur, cuts):
    buf = np.zeros(int((dur + 1) * SR))
    for c in cuts[1:]:
        t = c['t']
        # whoosh into the cut
        n = int(.32 * SR); x = rng.standard_normal(n); lo = np.linspace(300, 3500, n)
        y = np.zeros(n)
        for k in range(0, n, 2400):
            seg = x[k:k + 2400]; f = lo[k]; y[k:k + len(seg)] = bp(seg, f, min(f * 2.2, 20000))
        y *= np.linspace(0, 1, n) ** 2 * .35
        add(buf, y, t - .32)
        # impact
        m = int(.6 * SR); tt = np.arange(m) / SR
        boom = np.sin(2 * np.pi * (40 + 60 * np.exp(-tt / .05)) * tt) * env(m, .001, .22) * .7
        crack = hp(rng.standard_normal(m), 3000) * env(m, .0005, .03) * .25
        add(buf, boom + crack, t)
        if c['kind'] == 'end':  # sparkle
            for k in range(14):
                add(buf, tone(1800 + 220 * (k % 7), .25, 'sine', .06, dec=.12), t + .3 + k * .06)
    return buf

if __name__ == '__main__':
    v = sys.argv[1]
    cuts = json.load(open(f'cuts{v}.json')); tl = json.load(open('timeline.json'))[v]; dur = tl['duration']
    m = music(dur); s = sfx(dur, cuts)
    n = int(dur * SR); m = m[:n]; s = s[:n]
    fade = np.ones(n); fo = int(1.2 * SR); fade[-fo:] = np.linspace(1, 0, fo)
    sf.write(f'music{v}.wav', (m * fade / (np.abs(m).max() + 1e-9) * .8).astype(np.float32), SR)
    sf.write(f'sfx{v}.wav', (s / (np.abs(s).max() + 1e-9) * .8).astype(np.float32), SR)
    print('ok', v)
