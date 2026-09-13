import express from 'express';
import cors from 'cors';
import multer from 'multer';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url));
const dir=path.join(root,'data');
const dbFile=path.join(dir,'registry.json');
fs.mkdirSync(dir,{recursive:true});
const seed={users:[],projects:[],mrv:[],evidence:[],notifications:[],disputes:[],sensors:[],batches:[],audit:[],otp:{}};
const load=()=>fs.existsSync(dbFile)?{...seed,...JSON.parse(fs.readFileSync(dbFile,'utf8'))}:structuredClone(seed);
const save=d=>fs.writeFileSync(dbFile,JSON.stringify(d,null,2));
const now=()=>new Date().toISOString();
const id=a=>Math.max(0,...a.map(x=>Number(x.id)||0))+1;
const audit=(d,action,meta={})=>d.audit.push({id:id(d.audit),action,meta,at:now()});
const notify=(d,type,meta={})=>d.notifications.push({id:id(d.notifications),type,...meta,created_at:now()});
const app=express();
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:15*1024*1024}});
app.use(cors());app.use(express.json({limit:'2mb'}));

function parseGPS(body={}){
 const latitude=body.latitude===''||body.latitude==null?null:Number(body.latitude);
 const longitude=body.longitude===''||body.longitude==null?null:Number(body.longitude);
 const accuracy=body.gps_accuracy_m===''||body.gps_accuracy_m==null?null:Number(body.gps_accuracy_m);
 const capturedAt=body.captured_at||null;const errors=[],warnings=[];
 if(latitude==null||longitude==null) errors.push('GPS coordinates are required');
 else{if(!Number.isFinite(latitude)||latitude<-90||latitude>90)errors.push('Latitude must be between -90 and 90');if(!Number.isFinite(longitude)||longitude<-180||longitude>180)errors.push('Longitude must be between -180 and 180');}
 if(accuracy==null) warnings.push('GPS_ACCURACY_NOT_REPORTED');
 else if(!Number.isFinite(accuracy)||accuracy<0)errors.push('GPS accuracy must be a non-negative number');
 else if(accuracy>50)warnings.push('LOW_GPS_ACCURACY');
 if(!capturedAt)errors.push('GPS capture timestamp is required');
 else if(Number.isNaN(Date.parse(capturedAt)))errors.push('Invalid GPS capture timestamp');
 else if(Date.parse(capturedAt)>Date.now()+5*60*1000)errors.push('GPS timestamp is in the future');
 else if(Date.now()-Date.parse(capturedAt)>24*60*60*1000)warnings.push('GPS_CAPTURE_OLDER_THAN_24H');
 return{valid:errors.length===0,errors,warnings,latitude,longitude,accuracy_m:accuracy,captured_at:capturedAt};
}
function validateProjectInput(p){if(!p.name||!p.ecosystem||!p.location||Number(p.area_hectares)<=0)return'Project name, ecosystem, location and positive area are required';return null;}
function calc(d,x){
 const p=d.projects.find(y=>y.id===Number(x.project_id));if(!p)throw Error('Project not found');
 const gps=parseGPS(x);const biomass=Number(x.biomass_tonnes_per_hectare),soil=Number(x.soil_carbon_tonnes_per_hectare),permanence=Number(x.permanence_factor);
 if(!Number.isFinite(biomass)||biomass<0||!Number.isFinite(soil)||soil<0||!Number.isFinite(permanence)||permanence<0||permanence>1)throw Error('Invalid MRV measurement values');
 const gross=Number(p.area_hectares)*(biomass+soil);const flags=[...gps.warnings];if(!x.evidence_hash)flags.push('MISSING_EVIDENCE_HASH');if(!gps.valid)flags.push('INVALID_GPS_METADATA');
 return{gross_carbon_tonnes:+gross.toFixed(3),indicative_carbon_tonnes:+(gross*permanence).toFixed(3),method:'area × (biomass + soil carbon) × permanence factor',digital_intelligence:{risk:flags.length?'HIGH':'LOW',flags},gps_validation:gps,disclaimer:'Illustrative prototype estimate; approved methodology and independent verification are required for real credits.'};
}

app.get('/health',(_,r)=>r.json({status:'ok',service:'blue-carbon-node-api',version:'5.0.0',features:['hybrid-mrv','gps-validation','timestamped-evidence','sha256','ipfs-pinata','offline-sync','otp','kyc','iot-alerts','batch-verification','disputes','notifications','audit-trail']}));
app.get('/api/dashboard',(_,r)=>{const d=load(),v=d.mrv.filter(x=>x.status==='VERIFIED');r.json({projects:d.projects.length,area_hectares:d.projects.reduce((s,x)=>s+Number(x.area_hectares||0),0),mrv_submissions:d.mrv.length,pending_verification:d.mrv.filter(x=>x.status==='SUBMITTED').length,verified_carbon_tonnes:v.reduce((s,x)=>s+Number(x.verified_carbon_tonnes||0),0),users:d.users.length,open_disputes:d.disputes.filter(x=>x.status==='OPEN').length,sensor_readings:d.sensors.length,queued_batches:d.batches.filter(x=>x.status==='QUEUED').length});});
app.get('/api/projects',(_,r)=>r.json(load().projects));
app.get('/api/mrv',(_,r)=>r.json(load().mrv));
app.get('/api/notifications',(_,r)=>r.json(load().notifications.slice(-100).reverse()));
app.get('/api/disputes',(_,r)=>r.json(load().disputes));
app.get('/api/audit',(_,r)=>r.json(load().audit.slice(-200).reverse()));
app.get('/api/sensors',(_,r)=>r.json(load().sensors.slice(-200).reverse()));
app.get('/api/users',(_,r)=>r.json(load().users));

app.post('/api/gps/validate',(req,r)=>{const result=parseGPS(req.body);const d=load();audit(d,'GPS_VALIDATED',{valid:result.valid,latitude:result.latitude,longitude:result.longitude,accuracy_m:result.accuracy_m,warnings:result.warnings});save(d);r.status(result.valid?200:400).json(result);});

app.post('/api/auth/request-otp',async(req,r)=>{
 const d=load(),phone=String(req.body.phone||'').replace(/\D/g,'');if(!/^\d{10,15}$/.test(phone))return r.status(400).json({detail:'Valid phone required'});
 const code=String(Math.floor(100000+Math.random()*900000));d.otp[phone]={code,created_at:now()};let sent=false;
 if(process.env.TWILIO_ACCOUNT_SID&&process.env.TWILIO_AUTH_TOKEN&&process.env.TWILIO_FROM&&req.body.to){try{const token=Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');const form=new URLSearchParams({To:req.body.to,From:process.env.TWILIO_FROM,Body:`BlueCarbon Registry OTP: ${code}`});const z=await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,{method:'POST',headers:{Authorization:`Basic ${token}`,'Content-Type':'application/x-www-form-urlencoded'},body:form});sent=z.ok;}catch{sent=false;}}
 audit(d,'OTP_REQUESTED',{phone_suffix:phone.slice(-4),delivery:sent?'sms':'demo'});save(d);r.json({sent:true,delivery:sent?'sms':'demo',demo_otp:sent?undefined:code,message:sent?'OTP sent through configured SMS provider.':'Demo OTP returned because SMS provider is not configured.'});
});
app.post('/api/auth/verify-otp',(req,r)=>{const d=load(),phone=String(req.body.phone||'').replace(/\D/g,''),e=d.otp?.[phone];if(!e||e.code!==String(req.body.code))return r.status(401).json({detail:'Invalid OTP'});if(Date.now()-Date.parse(e.created_at)>10*60*1000)return r.status(401).json({detail:'OTP expired'});delete d.otp[phone];audit(d,'OTP_VERIFIED',{phone_suffix:phone.slice(-4)});save(d);r.json({verified:true,phone});});
app.post('/api/users',(req,r)=>{const d=load(),u=req.body;if(!u.name||!u.phone||!['NGO','VERIFIER','ADMIN'].includes(u.role))return r.status(400).json({detail:'name, phone and valid role required'});if(d.users.some(x=>x.phone===u.phone))return r.status(409).json({detail:'User already registered'});const x={id:crypto.randomUUID(),name:u.name,phone:u.phone,role:u.role,language:u.language||'en',kyc_status:'PENDING',otp_verified:Boolean(u.otp_verified),created_at:now()};d.users.push(x);audit(d,'USER_REGISTERED',{user_id:x.id,role:x.role});save(d);r.status(201).json(x);});
app.patch('/api/users/:id/kyc',(req,r)=>{const d=load(),u=d.users.find(x=>x.id===req.params.id);if(!u)return r.status(404).json({detail:'User not found'});if(!['PENDING','VERIFIED','REJECTED'].includes(req.body.kyc_status))return r.status(400).json({detail:'Invalid KYC status'});u.kyc_status=req.body.kyc_status;u.kyc_reference=req.body.kyc_reference||u.kyc_reference||'';u.kyc_updated_at=now();audit(d,'KYC_UPDATED',{user_id:u.id,status:u.kyc_status});notify(d,'KYC_UPDATED',{user_id:u.id,status:u.kyc_status});save(d);r.json(u);});

app.post('/api/projects',(req,r)=>{const d=load(),p=req.body,problem=validateProjectInput(p),gps=parseGPS(p);if(problem)return r.status(400).json({detail:problem});if(!gps.valid)return r.status(400).json({detail:gps.errors.join('; '),gps});const x={id:id(d.projects),...p,area_hectares:Number(p.area_hectares),latitude:gps.latitude,longitude:gps.longitude,gps_accuracy_m:gps.accuracy_m,captured_at:gps.captured_at,gps_warnings:gps.warnings,status:'PENDING_VERIFICATION',created_at:now(),evidence:{hash:p.evidence_hash||'',capture_proof_hash:p.capture_proof_hash||'',geotag:true,gps_accuracy_m:gps.accuracy_m,timestamp:gps.captured_at,ipfs_cid:p.ipfs_cid||''}};d.projects.push(x);notify(d,'VERIFICATION_REQUEST',{project_id:x.id});audit(d,'PROJECT_CREATED',{project_id:x.id,gps:{latitude:x.latitude,longitude:x.longitude,accuracy_m:x.gps_accuracy_m,captured_at:x.captured_at}});save(d);r.status(201).json(x);});

app.post('/api/evidence/hash',upload.single('file'),(req,r)=>{if(!req.file)return r.status(400).json({detail:'File required'});const gps=parseGPS(req.body);if(!gps.valid)return r.status(400).json({detail:gps.errors.join('; '),gps});const d=load();const sha256=crypto.createHash('sha256').update(req.file.buffer).digest('hex');const binding=JSON.stringify({sha256,latitude:gps.latitude,longitude:gps.longitude,accuracy_m:gps.accuracy_m,captured_at:gps.captured_at});const captureProofHash=crypto.createHash('sha256').update(binding).digest('hex');const x={id:id(d.evidence),filename:req.file.originalname,bytes:req.file.size,mime:req.file.mimetype,sha256,capture_proof_hash:captureProofHash,captured_at:gps.captured_at,latitude:gps.latitude,longitude:gps.longitude,gps_accuracy_m:gps.accuracy_m,gps_warnings:gps.warnings,storage:'hash-only'};d.evidence.push(x);audit(d,'EVIDENCE_HASHED_AND_GEOTAGGED',{evidence_id:x.id,sha256,capture_proof_hash:captureProofHash});save(d);r.json(x);});

app.post('/api/evidence/ipfs',upload.single('file'),async(req,r)=>{
 if(!req.file)return r.status(400).json({detail:'File required'});if(!process.env.PINATA_JWT)return r.status(503).json({detail:'PINATA_JWT is not configured. SHA-256 geotagging remains available.'});
 try{const form=new FormData();form.append('file',new Blob([req.file.buffer]),req.file.originalname);const z=await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS',{method:'POST',headers:{Authorization:`Bearer ${process.env.PINATA_JWT}`},body:form});const out=await z.json();if(!z.ok)throw Error(out.error?.details||out.error||'Pinata upload failed');const d=load();const x={id:id(d.evidence),filename:req.file.originalname,sha256:crypto.createHash('sha256').update(req.file.buffer).digest('hex'),ipfs_cid:out.IpfsHash,storage:'pinata-ipfs',created_at:now()};d.evidence.push(x);audit(d,'EVIDENCE_PINNED_IPFS',{evidence_id:x.id,cid:x.ipfs_cid});save(d);r.status(201).json(x);}catch(e){r.status(502).json({detail:e.message});}
});

app.post('/api/mrv/calculate',(req,r)=>{try{r.json(calc(load(),req.body));}catch(e){r.status(400).json({detail:e.message});}});
app.post('/api/mrv',(req,r)=>{try{const d=load(),x=req.body,c=calc(d,x);if(!c.gps_validation.valid)return r.status(400).json({detail:c.gps_validation.errors.join('; '),gps:c.gps_validation});if(!x.evidence_hash)return r.status(400).json({detail:'Evidence SHA-256 is required before MRV submission'});const m={id:id(d.mrv),...x,...c,status:'SUBMITTED',verification:{verifier:'',decision:'',comments:''},submitted_at:now()};d.mrv.push(m);notify(d,'MRV_SUBMITTED',{mrv_id:m.id});audit(d,'MRV_SUBMITTED',{mrv_id:m.id,project_id:m.project_id});save(d);r.status(201).json(m);}catch(e){r.status(400).json({detail:e.message});}});
app.post('/api/mrv/:id/verify',(req,r)=>{const d=load(),m=d.mrv.find(x=>x.id===Number(req.params.id));if(!m)return r.status(404).json({detail:'MRV not found'});if(m.status!=='SUBMITTED')return r.status(409).json({detail:'MRV already reviewed'});const x=req.body;if(!['APPROVE','REJECT'].includes(x.decision)||!x.comments)return r.status(400).json({detail:'Decision and comments required'});m.verification={verifier:x.verifier||'human-verifier',decision:x.decision,comments:x.comments,reviewed_at:now()};m.status=x.decision==='APPROVE'?'VERIFIED':'REJECTED';if(m.status==='VERIFIED')m.verified_carbon_tonnes=m.indicative_carbon_tonnes;notify(d,`MRV_${m.status}`,{mrv_id:m.id});audit(d,'MRV_REVIEWED',{mrv_id:m.id,status:m.status,comments:x.comments});save(d);r.json(m);});
app.post('/api/mrv/batch-verify',(req,r)=>{const d=load(),ids=(req.body.ids||[]).map(Number),items=d.mrv.filter(x=>ids.includes(x.id)&&x.status==='SUBMITTED');if(!items.length)return r.status(400).json({detail:'No submitted MRVs found'});const b={id:id(d.batches),ids:items.map(x=>x.id),status:'QUEUED',created_at:now(),count:items.length};d.batches.push(b);notify(d,'BATCH_VERIFICATION_QUEUED',{batch_id:b.id,count:b.count});audit(d,'BATCH_VERIFICATION_QUEUED',{batch_id:b.id,count:b.count});save(d);r.status(201).json(b);});
app.post('/api/mrv/batch-verify/process',(req,r)=>{const d=load(),ids=(req.body.ids||[]).map(Number),decision=req.body.decision,comments=req.body.comments||'Batch human validation';if(!['APPROVE','REJECT'].includes(decision))return r.status(400).json({detail:'Decision must be APPROVE or REJECT'});const items=d.mrv.filter(x=>ids.includes(x.id)&&x.status==='SUBMITTED');items.forEach(m=>{m.verification={verifier:req.body.verifier||'batch-verifier',decision,comments,reviewed_at:now()};m.status=decision==='APPROVE'?'VERIFIED':'REJECTED';if(decision==='APPROVE')m.verified_carbon_tonnes=m.indicative_carbon_tonnes;});const b=d.batches.find(x=>x.ids?.some(i=>ids.includes(i))&&x.status==='QUEUED');if(b)b.status='PROCESSED';notify(d,'BATCH_VERIFICATION_PROCESSED',{count:items.length,decision});audit(d,'BATCH_VERIFICATION_PROCESSED',{count:items.length,decision});save(d);r.json({processed:items.length,decision,items});});

app.post('/api/disputes',(req,r)=>{const d=load(),x={id:id(d.disputes),project_id:req.body.project_id?Number(req.body.project_id):null,mrv_id:req.body.mrv_id?Number(req.body.mrv_id):null,raised_by:req.body.raised_by||'demo-user',reason:req.body.reason||'Review requested',status:'OPEN',created_at:now()};d.disputes.push(x);notify(d,'DISPUTE_OPENED',{dispute_id:x.id});audit(d,'DISPUTE_OPENED',{dispute_id:x.id});save(d);r.status(201).json(x);});
app.patch('/api/disputes/:id',(req,r)=>{const d=load(),x=d.disputes.find(y=>y.id===Number(req.params.id));if(!x)return r.status(404).json({detail:'Dispute not found'});if(!['OPEN','IN_REVIEW','RESOLVED','REJECTED'].includes(req.body.status))return r.status(400).json({detail:'Invalid dispute status'});x.status=req.body.status;x.resolution=req.body.resolution||x.resolution||'';x.updated_at=now();audit(d,'DISPUTE_UPDATED',{dispute_id:x.id,status:x.status});notify(d,'DISPUTE_UPDATED',{dispute_id:x.id,status:x.status});save(d);r.json(x);});

app.post('/api/sensors/readings',(req,r)=>{const d=load(),metric=String(req.body.metric||'').toLowerCase(),value=Number(req.body.value);if(!metric||!Number.isFinite(value))return r.status(400).json({detail:'metric and numeric value required'});const thresholds={soil_moisture:{min:20,max:80},salinity:{min:0,max:35},temperature:{min:0,max:45}};const t=thresholds[metric],alerts=t&& (value<t.min||value>t.max)?[`${metric.toUpperCase()}_OUT_OF_RANGE`]:[];const x={id:id(d.sensors),sensor_id:req.body.sensor_id||'SIM-SENSOR-01',project_id:Number(req.body.project_id)||null,metric,value,unit:req.body.unit||'',captured_at:req.body.captured_at||now(),latitude:req.body.latitude??null,longitude:req.body.longitude??null,source:req.body.source||'simulator',alerts};d.sensors.push(x);if(alerts.length)notify(d,'IOT_ALERT',{sensor_id:x.sensor_id,metric,value,alerts});audit(d,'IOT_READING',{sensor_id:x.sensor_id,metric,value,alerts});save(d);r.status(201).json(x);});

app.post('/api/offline/sync',(req,r)=>{const d=load(),pack=req.body.pack||req.body,results=[];for(const p of pack.projects||[]){const gps=parseGPS(p);if(!gps.valid){results.push({type:'project',name:p.name,status:'GPS_VALIDATION_FAILED',gps});continue;}const exists=d.projects.find(x=>x.offline_id&&x.offline_id===p.offline_id);if(exists){results.push({type:'project',id:exists.id,status:'ALREADY_SYNCED'});continue;}const x={id:id(d.projects),...p,area_hectares:Number(p.area_hectares||0),latitude:gps.latitude,longitude:gps.longitude,gps_accuracy_m:gps.accuracy_m,captured_at:gps.captured_at,gps_warnings:gps.warnings,status:'PENDING_VERIFICATION',created_at:now(),synced_from_offline:true,evidence:{hash:p.evidence_hash||'',capture_proof_hash:p.capture_proof_hash||'',geotag:true}};d.projects.push(x);notify(d,'OFFLINE_PROJECT_SYNCED',{project_id:x.id});results.push({type:'project',id:x.id,status:'SYNCED'});audit(d,'OFFLINE_PROJECT_SYNCED',{project_id:x.id});}for(const e of pack.evidence||[])results.push({type:'evidence',sha256:e.sha256,status:'READY'});audit(d,'OFFLINE_PACK_SYNC',{items:results.length});save(d);r.json({synced:true,items:results.length,results});});

app.listen(process.env.PORT||3000,()=>console.log(`Blue Carbon Node API running on ${process.env.PORT||3000}`));