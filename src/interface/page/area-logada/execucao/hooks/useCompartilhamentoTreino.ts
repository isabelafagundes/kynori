import { useState } from "react";
import type { ResumoCompartilhamento } from "@/application/compartilhamento/calcular-resumo-treino";
import type { Ficha, RegistroTreino, TipoCardioDef } from "@/domain/tipos";
import { compartilharResultado } from "@/infrastructure/service/compartilhar-resultado.service";
import type { SelecaoFundo } from "@/interface/widget/fundo-resultado/presets-fundo";
import { desenharCard } from "../desenhar-card";
export function useCompartilhamentoTreino(registro:RegistroTreino,ficha:Ficha,resumo:ResumoCompartilhamento,fundo:SelecaoFundo,grupos:string[],tiposCardio:TipoCardioDef[]=[]){const[compartilhando,setCompartilhando]=useState(false);const[erro,setErro]=useState<string|null>(null);return{compartilhando,erro,compartilhar:async()=>{if(compartilhando)return;setCompartilhando(true);setErro(null);try{const blob=await desenharCard(registro,ficha,resumo,fundo,grupos,tiposCardio);await compartilharResultado(blob,`kynori-${registro.id}.jpg`);}catch(e){setErro(e instanceof Error?e.message:"Não foi possível compartilhar. Tente novamente.");}finally{setCompartilhando(false);}}};}
