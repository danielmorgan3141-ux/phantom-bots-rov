import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
for(const name of (await fs.readdir('dist')).filter(f=>f.endsWith('.js'))){const r=spawnSync(process.execPath,['--check','dist/'+name],{stdio:'inherit'});if(r.status!==0)process.exit(r.status||1)}
for(const name of (await fs.readdir('tests')).filter(f=>f.endsWith('.cjs')).sort()){const r=spawnSync(process.execPath,['tests/'+name],{stdio:'inherit'});if(r.status!==0)process.exit(r.status||1)}
