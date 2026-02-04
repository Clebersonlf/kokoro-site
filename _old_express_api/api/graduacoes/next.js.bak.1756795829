const { query } = require('../_db');
module.exports = async (req,res)=>{
  res.setHeader('Content-Type','application/json; charset=utf-8');
  try{
    const r = await query(`select max(grad_numero) as max from graduacoes`);
    const max = r.rows[0]?.max;
    let n = 74;
    if (max) {
      const cur = parseInt(max,10);
      if (!Number.isNaN(cur)) n = Math.max(cur+1, 74);
    }
    res.status(200).end(JSON.stringify({ ok:true, numero: String(n).padStart(4,'0') }));
  }catch(e){
    console.error(e);
    res.status(500).end(JSON.stringify({ ok:false, message:'Erro ao sugerir número'}));
  }
};
