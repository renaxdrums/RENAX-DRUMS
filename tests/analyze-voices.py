import wave, json, pathlib, numpy as np
root=pathlib.Path(__file__).resolve().parents[1]
rows=[]
for p in sorted((root/'assets/voices').glob('*/*.wav')):
 with wave.open(str(p)) as w:
  sr=w.getframerate(); x=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').astype(float)/32768
 # 5 ms RMS windows, 1 ms hop; find first sustained 10 ms at 20% of peak RMS.
 rms=np.sqrt(np.convolve(x*x,np.ones(240)/240,'valid'))[::48]
 threshold=max(.01,float(rms.max())*.20)
 above=rms>=threshold
 onset=next((i for i in range(len(above)-9) if above[i:i+10].all()),0)
 rows.append(dict(bank=p.parent.name,number=int(p.stem),duration_ms=round(len(x)/sr*1000,3),attack_ms=onset,peak_rms=round(float(rms.max()),4)))
pathlib.Path(__file__).with_name('measured-attacks.json').write_text(json.dumps(rows,indent=2))
for bank in sorted(set(r['bank'] for r in rows)):
 print(bank,[(r['number'],r['attack_ms']) for r in rows if r['bank']==bank])
