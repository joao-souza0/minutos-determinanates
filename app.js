const TIPOS = [
  { id: "cozinha", nome: "Cozinha", base: 420, diasPorM2: 0.55 },
  { id: "banho", nome: "Casa de banho", base: 580, diasPorM2: 0.8 },
  { id: "interior", nome: "Interior / sala", base: 260, diasPorM2: 0.35 },
  { id: "integral", nome: "Remodelação integral", base: 390, diasPorM2: 0.7 },
  { id: "fachada", nome: "Fachada / exterior", base: 210, diasPorM2: 0.28 },
];

const QUALIDADE = {
  essencial: { nome: "Essencial", fator: 0.86 },
  conforto: { nome: "Conforto", fator: 1 },
  assinatura: { nome: "Assinatura", fator: 1.28 },
};

const EXTRAS = {
  pintura: { nome: "Pintura", porM2: 18 },
  pavimento: { nome: "Pavimento novo", porM2: 42 },
  eletrico: { nome: "Quadro e pontos elétricos", porM2: 28 },
  hidraulico: { nome: "Hidráulica", porM2: 36 },
  mobiliario: { nome: "Mobiliário à medida", porM2: 95 },
};

const CONFORTO = {
  protecao: { nome: "Proteção de pó e móveis", fixo: 240 },
  sanitario: { nome: "Sanitário provisório", fixo: 450 },
  horario: { nome: "Horário reduzido", taxa: 0.06, dias: 1.15 },
};

const HORARIOS = {
  manha: "manhã, 9h–12h",
  tarde: "tarde, 14h–17h",
  fim: "fim de tarde, 17h–19h",
};

const CANAIS = {
  telefone: "telefone",
  whatsapp: "WhatsApp",
  email: "email",
};

const PACOTES = [
  {
    nome: "Essencial",
    preco: "A partir de 4 800 €",
    pontos: ["Acabamentos sólidos", "Prazo curto", "Ideal para atualizar uma divisão"],
  },
  {
    nome: "Conforto",
    preco: "A partir de 8 900 €",
    pontos: ["Materiais de linha média-alta", "Iluminação pensada", "Acompanhamento semanal"],
  },
  {
    nome: "Assinatura",
    preco: "A partir de 14 500 €",
    pontos: ["Peças à medida", "Direção de obra dedicada", "Detalhe de projeto"],
  },
  {
    nome: "Visita técnica",
    preco: "0 €",
    pontos: ["Levantamento no local", "Medidas e fotos", "Orçamento formal em 48h"],
  },
];

const KEY = "md-orcamentos";
const RASCUNHO = "md-rascunho";
const PROJETO = "md-projeto";
const WHATSAPP = "351220000000";
const DESLOCACAO = 180;

const ZONAS = [
  {
    grupo: "incluida",
    nomes: [
      "porto", "cedofeita", "foz", "foz do douro", "paranhos", "campanha", "bonfim",
      "ramalde", "lordelo do ouro", "aldoar", "nevogilde", "massarelos", "miragaia",
      "vitoria", "santo ildefonso", "campanha", "matosinhos", "leca da palmeira",
      "leça da palmeira", "senhora da hora", "perafita", "gaia", "vila nova de gaia",
      "madalena", "canidelo", "mafamude", "oliveira do douro", "gondomar", "rio tinto",
      "valbom", "fanzeres", "maia", "moreira", "castelo da maia", "aguas santas",
      "águas santas", "valongo", "ermesinde", "alfena",
    ],
  },
  {
    grupo: "limite",
    taxa: DESLOCACAO,
    nomes: [
      "espinho", "vila do conde", "povoa de varzim", "povoa", "santa maria da feira",
      "santo tirso", "trofa", "paredes", "oliveira de azemeis", "vila nova de famalicao",
      "famalicao",
    ],
  },
];

const form = document.getElementById("form-orcamento");
const tipoSelect = form.querySelector('[name="tipo"]');
const savedList = document.getElementById("saved-list");
const contactForm = document.getElementById("form-contacto");
let ultimoOrcamento = null;
let compararIds = [];

function euro(valor) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(valor);
}

function escapar(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function comImposto(valor) {
  return Math.round(valor * 1.23);
}

function totalApresentado(orcamento) {
  return orcamento.comIva ? comImposto(orcamento.total) : orcamento.total;
}

function lerGuardados() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function escreverGuardados(lista) {
  localStorage.setItem(KEY, JSON.stringify(lista));
}

function lerMarcados(nome) {
  return [...form.querySelectorAll(`[name="${nome}"]:checked`)].map((el) => el.value);
}

function montarOrcamento({ tipo, area, qualidadeId, extrasAtivos, confortoAtivos, titulo, comIva, deslocacao, id }) {
  const qualidade = QUALIDADE[qualidadeId] || QUALIDADE.conforto;
  const linhas = [
    {
      nome: `${tipo.nome} · ${area} m² · ${qualidade.nome}`,
      valor: Math.round(tipo.base * area * qualidade.fator),
    },
  ];

  extrasAtivos.forEach((extraId) => {
    const extra = EXTRAS[extraId];
    if (extra) linhas.push({ nome: extra.nome, valor: Math.round(extra.porM2 * area) });
  });

  let dias = Math.max(7, Math.round(area * tipo.diasPorM2 * qualidade.fator + extrasAtivos.length * 2));
  confortoAtivos.forEach((confortoId) => {
    const item = CONFORTO[confortoId];
    if (!item) return;
    if (item.fixo) linhas.push({ nome: item.nome, valor: item.fixo });
    if (item.taxa) linhas.push({ nome: item.nome, valor: Math.round(linhas[0].valor * item.taxa) });
    if (item.dias) dias = Math.max(dias + 1, Math.round(dias * item.dias));
  });

  if (deslocacao) linhas.push({ nome: "Deslocação fora do Grande Porto", valor: DESLOCACAO });

  const total = Math.round(linhas.reduce((acc, linha) => acc + linha.valor, 0));
  return {
    id: id || crypto.randomUUID(),
    titulo: titulo || `${tipo.nome} ${area} m²`,
    tipo: tipo.nome,
    tipoId: tipo.id,
    area,
    qualidade: qualidade.nome,
    qualidadeId,
    extras: extrasAtivos.map((extraId) => EXTRAS[extraId]?.nome).filter(Boolean),
    extrasIds: extrasAtivos,
    conforto: confortoAtivos.map((confortoId) => CONFORTO[confortoId]?.nome).filter(Boolean),
    confortoIds: confortoAtivos,
    deslocacao: Boolean(deslocacao),
    comIva: Boolean(comIva),
    linhas,
    total,
    minimo: Math.round(total * 0.9),
    maximo: Math.round(total * 1.12),
    dias,
    fases: fasesObra(dias),
    criadoEm: new Date().toISOString(),
  };
}

function calcular() {
  const tipo = TIPOS.find((item) => item.id === tipoSelect.value) || TIPOS[0];
  const area = Math.min(400, Math.max(4, Number(form.area.value) || 0));
  return montarOrcamento({
    tipo,
    area,
    qualidadeId: form.qualidade.value,
    extrasAtivos: lerMarcados("extras"),
    confortoAtivos: lerMarcados("conforto"),
    titulo: form.titulo.value.trim(),
    comIva: form.comIva.checked,
    deslocacao: form.deslocacao.checked,
  });
}

function alternativas(base) {
  const tipo = TIPOS.find((item) => item.id === base.tipoId) || TIPOS[0];
  return Object.keys(QUALIDADE).map((qualidadeId) =>
    montarOrcamento({
      tipo,
      area: base.area,
      qualidadeId,
      extrasAtivos: base.extrasIds || [],
      confortoAtivos: base.confortoIds || [],
      titulo: base.titulo,
      comIva: base.comIva,
      deslocacao: base.deslocacao,
      id: base.id,
    })
  );
}

function fasesObra(dias) {
  const pesos = [
    ["Preparação e demolições", 0.2],
    ["Instalações", 0.35],
    ["Acabamentos e revestimentos", 0.3],
    ["Limpeza, checklist e entrega", 0.15],
  ];
  const diasFase = pesos.map(([, peso]) => Math.max(1, Math.round(dias * peso)));
  diasFase[diasFase.length - 1] += dias - diasFase.reduce((soma, valor) => soma + valor, 0);
  if (diasFase[diasFase.length - 1] < 1) {
    const ajuste = 1 - diasFase[diasFase.length - 1];
    diasFase[diasFase.length - 1] = 1;
    diasFase[1] = Math.max(1, diasFase[1] - ajuste);
  }
  return pesos.map(([nome], indice) => ({ nome, dias: diasFase[indice] }));
}

function linhaContrato(celulas) {
  return `<tr>${celulas.map((celula) => `<td>${celula}</td>`).join("")}</tr>`;
}

function preencherContrato(orcamento) {
  const agora = new Date();
  const nome = contactForm.nome.value.trim();
  const telefone = contactForm.telefone.value.trim();
  const email = contactForm.email.value.trim();
  const zona = contactForm.zona.value.trim();
  const cliente = nome || "________________________________";
  const sinal = Math.round(orcamento.total * 0.3);
  const instalacoes = Math.round(orcamento.total * 0.3);
  const acabamentos = Math.round(orcamento.total * 0.25);
  const saldo = orcamento.total - sinal - instalacoes - acabamentos;
  const fases = fasesObra(orcamento.dias);
  const extras = (orcamento.extras || []).length ? orcamento.extras.join(", ") : "sem extras";
  const conforto = (orcamento.conforto || []).length ? ` Conforto em obra: ${orcamento.conforto.join(", ")}.` : "";

  document.getElementById("ct-ref").textContent = `MD-${agora.getFullYear()}${String(agora.getMonth() + 1).padStart(2, "0")}${String(agora.getDate()).padStart(2, "0")}-${String(orcamento.id || "rasc").slice(0, 4).toUpperCase()}`;
  document.getElementById("ct-data").textContent = agora.toLocaleDateString("pt-PT");
  document.getElementById("ct-titulo").textContent = orcamento.titulo;
  document.getElementById("ct-cliente").textContent = cliente;
  document.getElementById("ct-contacto").textContent = [telefone, email, zona].filter(Boolean).join(" · ") || "Contacto e morada da obra a completar na adjudicação.";
  document.getElementById("ct-objeto").textContent = `${orcamento.tipo}, ${orcamento.area} m², acabamento ${orcamento.qualidade}. Extras: ${extras}.${conforto}`;
  document.getElementById("ct-linhas").innerHTML = orcamento.linhas
    .map((linha) => linhaContrato([linha.nome, euro(linha.valor)]))
    .join("");
  const ivaNota = orcamento.comIva
    ? ` IVA a 23%: ${euro(comImposto(orcamento.total) - orcamento.total)}. Total com IVA: ${euro(comImposto(orcamento.total))}.`
    : "";
  document.getElementById("ct-preco").textContent = `Preço estimado da empreitada, sem IVA: ${euro(orcamento.total)}. Intervalo de referência após visita: ${euro(orcamento.minimo)} a ${euro(orcamento.maximo)}.${ivaNota}`;
  document.getElementById("ct-prazo").textContent = `Prazo de execução: ${orcamento.dias} dias úteis de obra, repartidos pelas fases abaixo.`;
  document.getElementById("ct-fases").innerHTML = [
    ...fases.map((fase) => linhaContrato([fase.nome, String(fase.dias)])),
    linhaContrato(["Total de dias úteis", String(orcamento.dias)]),
  ].join("");
  document.getElementById("ct-pagamentos").innerHTML = [
    ["Sinal de adjudicação", "Na assinatura, antes do início", euro(sinal)],
    ["Instalações concluídas", "Após a fase de instalações", euro(instalacoes)],
    ["Acabamentos concluídos", "Após revestimentos e acabamentos", euro(acabamentos)],
    ["Saldo", "Na entrega, com checklist assinado", euro(saldo)],
  ]
    .map((linha) => linhaContrato(linha))
    .join("");
  document.getElementById("ct-assinatura").textContent = nome || "\u00a0";
}

function linhasVisiveis(orcamento) {
  if (!orcamento.comIva) return orcamento.linhas;
  const iva = comImposto(orcamento.total) - orcamento.total;
  return [...orcamento.linhas, { nome: "IVA (23%)", valor: iva }];
}

function resumoTexto(orcamento) {
  const modo = orcamento.comIva ? "com IVA" : "sem IVA";
  const conforto = (orcamento.conforto || []).length ? ` Conforto em obra: ${orcamento.conforto.join(", ")}.` : "";
  const porM2 = orcamento.area ? ` (${euro(Math.round(totalApresentado(orcamento) / orcamento.area))}/m²)` : "";
  return `Olá, Minutos Determinantes. Simulei «${orcamento.titulo}»: ${euro(totalApresentado(orcamento))} ${modo}${porM2}, prazo de ${orcamento.dias} dias úteis.${conforto}`;
}

function marcosDe(valor) {
  const sinal = Math.round(valor * 0.3);
  const instalacoes = Math.round(valor * 0.3);
  const acabamentos = Math.round(valor * 0.25);
  const saldo = valor - sinal - instalacoes - acabamentos;
  return { sinal, instalacoes, acabamentos, saldo, restante: valor - sinal };
}

function renderPagamentos(orcamento) {
  const base = totalApresentado(orcamento);
  const marcos = marcosDe(base);
  const modo = orcamento.comIva ? "com IVA" : "sem IVA";
  document.getElementById("quote-marcos").textContent =
    `Sinal ${euro(marcos.sinal)} · Instalações ${euro(marcos.instalacoes)} · Acabamentos ${euro(marcos.acabamentos)} · Saldo ${euro(marcos.saldo)} (${modo})`;
  const meses = Number(document.getElementById("meses-saldo").value);
  document.getElementById("quote-prestacao").textContent = meses
    ? `Depois do sinal de ${euro(marcos.sinal)}, os ${euro(marcos.restante)} restantes ficam em ${meses} prestações de ${euro(Math.round(marcos.restante / meses))}, sem juros. É uma simulação: o calendário fecha-se no orçamento formal.`
    : `Depois do sinal de ${euro(marcos.sinal)}, o restante acompanha os marcos até ao saldo de ${euro(marcos.saldo)} na entrega.`;
}

function renderEstimativa(orcamento) {
  ultimoOrcamento = {
    ...orcamento,
    fases: orcamento.fases || fasesObra(orcamento.dias),
    extrasIds: orcamento.extrasIds || [],
    confortoIds: orcamento.confortoIds || [],
  };
  const total = totalApresentado(ultimoOrcamento);
  const minimo = ultimoOrcamento.comIva ? comImposto(ultimoOrcamento.minimo) : ultimoOrcamento.minimo;
  const maximo = ultimoOrcamento.comIva ? comImposto(ultimoOrcamento.maximo) : ultimoOrcamento.maximo;
  document.getElementById("quote-total").textContent = euro(total);
  document.getElementById("quote-m2").textContent = ultimoOrcamento.area
    ? `${euro(Math.round(total / ultimoOrcamento.area))} por m²`
    : "";
  document.getElementById("quote-iva").textContent = ultimoOrcamento.comIva ? "Total com IVA a 23%" : "Total sem IVA";
  document.getElementById("quote-range").textContent = `Intervalo típico: ${euro(minimo)} – ${euro(maximo)}`;
  document.getElementById("quote-prazo").textContent = `Prazo estimado em obra: ${ultimoOrcamento.dias} dias úteis`;
  document.getElementById("quote-fases").innerHTML = ultimoOrcamento.fases
    .map((fase) => {
      const peso = Math.round((fase.dias / ultimoOrcamento.dias) * 100);
      return `<li><span>${escapar(fase.nome)}</span><span class="fase-bar" aria-hidden="true"><span style="width:${peso}%"></span></span><strong>${fase.dias} d</strong></li>`;
    })
    .join("");
  document.getElementById("quote-compare").innerHTML = alternativas(ultimoOrcamento)
    .map((opcao) => {
      const ativo = opcao.qualidadeId === ultimoOrcamento.qualidadeId ? " ativo" : "";
      return `<button type="button" class="${ativo.trim()}" data-qualidade="${escapar(opcao.qualidadeId)}" aria-pressed="${ativo ? "true" : "false"}"><strong>${escapar(opcao.qualidade)}</strong><span>${euro(totalApresentado(opcao))} · ${opcao.dias} dias</span></button>`;
    })
    .join("");
  document.getElementById("quote-lines").innerHTML = linhasVisiveis(ultimoOrcamento)
    .map((linha) => `<li>${escapar(linha.nome)}: ${euro(linha.valor)}</li>`)
    .join("");
  document.getElementById("quote-nota").textContent = ultimoOrcamento.comIva
    ? "O total inclui IVA a 23%. A visita técnica no Porto confirma medidas, estado da casa e prazos."
    : "Valor sem IVA. A visita técnica no Porto confirma medidas, estado da casa e prazos.";
  renderPagamentos(ultimoOrcamento);
  preencherContrato(ultimoOrcamento);
}

function renderGuardados() {
  const lista = lerGuardados();
  if (!lista.length) {
    savedList.innerHTML = "<p class='fine'>Ainda não há orçamentos guardados neste dispositivo.</p>";
    return;
  }

  savedList.innerHTML = lista
    .map(
      (item) => `
      <article class="saved-item">
        <div>
          <strong>${escapar(item.titulo)}</strong>
          <p class="fine">${escapar(item.tipo)} · ${item.area} m² · ${euro(item.comIva ? comImposto(item.total) : item.total)}</p>
        </div>
        <div class="saved-actions">
          <button class="linkish" type="button" data-abrir="${item.id}">Abrir</button>
          <button class="linkish" type="button" data-comparar="${item.id}">Comparar</button>
          <button class="linkish" type="button" data-apagar="${item.id}">Apagar</button>
        </div>
      </article>`
    )
    .join("");
}

function guardar(orcamento) {
  const lista = [orcamento, ...lerGuardados()].slice(0, 8);
  escreverGuardados(lista);
  renderGuardados();
}

TIPOS.forEach((tipo) => {
  const option = document.createElement("option");
  option.value = tipo.id;
  option.textContent = tipo.nome;
  tipoSelect.append(option);
});

document.getElementById("lista-pacotes").innerHTML = PACOTES.map(
  (pacote) => `
  <article class="package">
    <h3>${pacote.nome}</h3>
    <p class="price">${pacote.preco}</p>
    <ul>${pacote.pontos.map((ponto) => `<li>${ponto}</li>`).join("")}</ul>
  </article>`
).join("");

document.getElementById("ano").textContent = new Date().getFullYear();

function atualizarAreaPelasMedidas(origem) {
  if (origem !== "comprimento" && origem !== "largura") return;
  const comprimento = Number(form.comprimento.value);
  const largura = Number(form.largura.value);
  if (comprimento > 0 && largura > 0) {
    form.area.value = String(Math.min(400, Math.max(4, Math.round(comprimento * largura))));
  }
}

function guardarRascunho() {
  const dados = {
    tipo: tipoSelect.value,
    area: form.area.value,
    comprimento: form.comprimento.value,
    largura: form.largura.value,
    qualidade: form.qualidade.value,
    titulo: form.titulo.value,
    extras: lerMarcados("extras"),
    conforto: lerMarcados("conforto"),
    comIva: form.comIva.checked,
    deslocacao: form.deslocacao.checked,
  };
  localStorage.setItem(RASCUNHO, JSON.stringify(dados));
}

function restaurarRascunho() {
  try {
    const dados = JSON.parse(localStorage.getItem(RASCUNHO) || "null");
    if (!dados) return;
    if (TIPOS.some((tipo) => tipo.id === dados.tipo)) tipoSelect.value = dados.tipo;
    if (dados.area) form.area.value = dados.area;
    form.comprimento.value = dados.comprimento || "";
    form.largura.value = dados.largura || "";
    if (QUALIDADE[dados.qualidade]) form.qualidade.value = dados.qualidade;
    form.titulo.value = dados.titulo || "";
    form.querySelectorAll('[name="extras"]').forEach((el) => {
      el.checked = (dados.extras || []).includes(el.value);
    });
    form.querySelectorAll('[name="conforto"]').forEach((el) => {
      el.checked = (dados.conforto || []).includes(el.value);
    });
    form.comIva.checked = Boolean(dados.comIva);
    form.deslocacao.checked = Boolean(dados.deslocacao);
  } catch {
    localStorage.removeItem(RASCUNHO);
  }
}

function idsPorNome(mapa, nomes = []) {
  return nomes
    .map((nome) => Object.keys(mapa).find((id) => mapa[id].nome === nome))
    .filter(Boolean);
}

function aplicarNoFormulario(item) {
  const tipoId = item.tipoId || TIPOS.find((tipo) => tipo.nome === item.tipo)?.id;
  const qualidadeId =
    item.qualidadeId || Object.keys(QUALIDADE).find((id) => QUALIDADE[id].nome === item.qualidade);
  if (tipoId) tipoSelect.value = tipoId;
  form.area.value = item.area;
  if (qualidadeId) form.qualidade.value = qualidadeId;
  form.titulo.value = item.titulo || "";
  const extrasIds = item.extrasIds?.length ? item.extrasIds : idsPorNome(EXTRAS, item.extras);
  const confortoIds = item.confortoIds?.length ? item.confortoIds : idsPorNome(CONFORTO, item.conforto);
  form.querySelectorAll('[name="extras"]').forEach((el) => {
    el.checked = extrasIds.includes(el.value);
  });
  form.querySelectorAll('[name="conforto"]').forEach((el) => {
    el.checked = confortoIds.includes(el.value);
  });
  form.comIva.checked = Boolean(item.comIva);
  form.deslocacao.checked = Boolean(item.deslocacao);
}

form.addEventListener("input", (evento) => {
  atualizarAreaPelasMedidas(evento.target.name);
  renderEstimativa(calcular());
  guardarRascunho();
});
form.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const orcamento = calcular();
  renderEstimativa(orcamento);
  guardar(orcamento);
});

function prepararImpressao() {
  if (ultimoOrcamento) preencherContrato(ultimoOrcamento);
  document.getElementById("contrato").hidden = false;
}

document.getElementById("btn-imprimir").addEventListener("click", () => {
  prepararImpressao();
  window.print();
});

window.addEventListener("beforeprint", prepararImpressao);

window.addEventListener("afterprint", () => {
  document.getElementById("contrato").hidden = true;
});

document.getElementById("btn-enviar").addEventListener("click", () => {
  document.getElementById("anexar-orcamento").checked = true;
  if (ultimoOrcamento) {
    contactForm.mensagem.value = `Pedido a partir do simulador: ${ultimoOrcamento.titulo}, ${euro(ultimoOrcamento.total)}, prazo ${ultimoOrcamento.dias} dias.`;
  }
  document.getElementById("contacto").scrollIntoView({ behavior: "smooth" });
  contactForm.nome.focus();
});

document.getElementById("btn-limpar").addEventListener("click", () => {
  escreverGuardados([]);
  compararIds = [];
  renderGuardados();
  renderComparacao();
});

savedList.addEventListener("click", (evento) => {
  const abrir = evento.target.dataset.abrir;
  const apagar = evento.target.dataset.apagar;
  const comparar = evento.target.dataset.comparar;
  if (apagar) {
    escreverGuardados(lerGuardados().filter((orcamento) => orcamento.id !== apagar));
    compararIds = compararIds.filter((id) => id !== apagar);
    renderGuardados();
    renderComparacao();
    return;
  }
  if (comparar) {
    compararIds = compararIds.includes(comparar)
      ? compararIds.filter((id) => id !== comparar)
      : [...compararIds, comparar].slice(-2);
    renderComparacao();
    return;
  }
  if (!abrir) return;
  const item = lerGuardados().find((orcamento) => orcamento.id === abrir);
  if (!item) return;
  aplicarNoFormulario(item);
  renderEstimativa(calcular());
  guardarRascunho();
  document.getElementById("orcamento").scrollIntoView({ behavior: "smooth" });
});

document.getElementById("quote-compare").addEventListener("click", (evento) => {
  const id = evento.target.closest("button")?.dataset.qualidade;
  if (!id || !QUALIDADE[id]) return;
  form.qualidade.value = id;
  renderEstimativa(calcular());
  guardarRascunho();
});

document.getElementById("btn-repor").addEventListener("click", () => {
  form.reset();
  form.area.value = "18";
  form.querySelector('[name="qualidade"][value="conforto"]').checked = true;
  form.querySelector('[name="extras"][value="pintura"]').checked = true;
  renderEstimativa(calcular());
  guardarRascunho();
});

function marcarCopia(texto) {
  document.getElementById("quote-copia").textContent = texto;
}

document.getElementById("btn-copiar").addEventListener("click", async () => {
  if (!ultimoOrcamento) return;
  try {
    await navigator.clipboard.writeText(resumoTexto(ultimoOrcamento));
    marcarCopia("Resumo copiado. Pode colá-lo numa mensagem ou num email.");
  } catch {
    marcarCopia("Não foi possível copiar neste browser. Use Partilhar no WhatsApp.");
  }
});

document.getElementById("meses-saldo").addEventListener("change", () => {
  if (ultimoOrcamento) renderPagamentos(ultimoOrcamento);
});

document.getElementById("btn-ligacao").addEventListener("click", async () => {
  if (!ultimoOrcamento) return;
  const params = new URLSearchParams({
    tipo: ultimoOrcamento.tipoId,
    area: String(ultimoOrcamento.area),
    q: ultimoOrcamento.qualidadeId,
    ex: (ultimoOrcamento.extrasIds || []).join(","),
    cf: (ultimoOrcamento.confortoIds || []).join(","),
    iva: ultimoOrcamento.comIva ? "1" : "0",
    d: ultimoOrcamento.deslocacao ? "1" : "0",
    t: ultimoOrcamento.titulo || "",
  });
  const url = `${location.origin}${location.pathname}?${params}#orcamento`;
  try {
    await navigator.clipboard.writeText(url);
    marcarCopia("Ligação copiada. Quem a abrir vê esta estimativa.");
  } catch {
    marcarCopia(url);
  }
});

document.getElementById("btn-whatsapp").addEventListener("click", () => {
  if (!ultimoOrcamento) return;
  const texto = resumoTexto(ultimoOrcamento);
  const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
  window.open(url, "_blank", "noopener");
});

document.getElementById("conforto-opcoes").addEventListener("click", (evento) => {
  const id = evento.target.closest("button")?.dataset.conforto;
  if (!id || !CONFORTO[id]) return;
  const caixa = form.querySelector(`[name="conforto"][value="${id}"]`);
  caixa.checked = true;
  renderEstimativa(calcular());
  guardarRascunho();
  document.getElementById("orcamento").scrollIntoView({ behavior: "smooth" });
});

contactForm.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const dados = Object.fromEntries(new FormData(contactForm));
  const pedido = {
    ...dados,
    orcamento: dados.anexar && ultimoOrcamento ? ultimoOrcamento : null,
    enviadoEm: new Date().toISOString(),
  };
  const caixa = JSON.parse(localStorage.getItem("md-pedidos") || "[]");
  caixa.unshift(pedido);
  localStorage.setItem("md-pedidos", JSON.stringify(caixa.slice(0, 20)));
  const quando = dados.dataVisita
    ? ` Visita pedida para ${new Date(`${dados.dataVisita}T12:00:00`).toLocaleDateString("pt-PT")}${dados.horario ? `, ${HORARIOS[dados.horario]}` : ""}.`
    : "";
  const canal = CANAIS[dados.canal] || "telefone";
  const habitada =
    dados.habitada && !(ultimoOrcamento?.conforto || []).length
      ? " Como a casa fica habitada, pode incluir proteção de pó ou sanitário provisório no simulador."
      : "";
  document.getElementById("contacto-status").textContent =
    `Pedido registado.${quando} Respondemos por ${canal}.${habitada} Nesta demonstração o envio fica guardado no seu browser.`;
  contactForm.reset();
  document.querySelectorAll("#agenda-visita button").forEach((botao) => botao.classList.remove("ativo"));
  const hoje = new Date();
  contactForm.dataVisita.min = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
});

const toggle = document.querySelector(".nav-toggle");
const menu = document.getElementById("menu");
toggle.addEventListener("click", () => {
  const aberto = menu.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(aberto));
});
menu.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menu.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  });
});

function renderComparacao() {
  const painel = document.getElementById("comparar");
  const lista = lerGuardados().filter((item) => compararIds.includes(item.id));
  if (lista.length < 2) {
    painel.hidden = lista.length !== 1;
    painel.innerHTML = lista.length === 1
      ? `<p>Escolheu «${escapar(lista[0].titulo)}». Escolha outro orçamento guardado para comparar.</p>`
      : "";
    return;
  }
  const [a, b] = lista;
  const va = a.comIva ? comImposto(a.total) : a.total;
  const vb = b.comIva ? comImposto(b.total) : b.total;
  const diferenca = va - vb;
  const favor = diferenca < 0 ? a.titulo : b.titulo;
  painel.hidden = false;
  painel.innerHTML = `
    <p><strong>${escapar(a.titulo)}</strong> · ${euro(va)} · ${a.dias} dias · ${euro(Math.round(va / a.area))}/m²</p>
    <p><strong>${escapar(b.titulo)}</strong> · ${euro(vb)} · ${b.dias} dias · ${euro(Math.round(vb / b.area))}/m²</p>
    <p class="fine">${diferenca === 0 ? "Os dois totais coincidem." : `Diferença de ${euro(Math.abs(diferenca))}. O mais baixo é «${escapar(favor)}».`}</p>`;
}

function lerProjeto() {
  try {
    return JSON.parse(localStorage.getItem(PROJETO) || "[]");
  } catch {
    return [];
  }
}

function escreverProjeto(lista) {
  localStorage.setItem(PROJETO, JSON.stringify(lista));
}

function orcamentoProjeto(lista = lerProjeto()) {
  if (!lista.length) return null;
  const bruto = lista.reduce((soma, item) => soma + item.total, 0);
  const desconto = lista.length > 1 ? Math.round(bruto * 0.04) : 0;
  const total = bruto - desconto;
  const ordenados = [...lista].sort((a, b) => b.dias - a.dias);
  const dias = ordenados.reduce((soma, item, indice) => soma + (indice === 0 ? item.dias : Math.round(item.dias * 0.55)), 0);
  const linhas = lista.flatMap((item) =>
    item.linhas.map((linha) => ({ nome: `${item.titulo}: ${linha.nome}`, valor: linha.valor }))
  );
  if (desconto) linhas.push({ nome: "Coordenação de várias divisões (−4%)", valor: -desconto });
  return {
    id: "proj",
    titulo: `Obra com ${lista.length} ${lista.length === 1 ? "divisão" : "divisões"}`,
    tipo: lista.map((item) => item.tipo).join(" + "),
    tipoId: lista[0].tipoId,
    area: lista.reduce((soma, item) => soma + item.area, 0),
    qualidade: [...new Set(lista.map((item) => item.qualidade))].join(", "),
    qualidadeId: lista[0].qualidadeId,
    extras: [...new Set(lista.flatMap((item) => item.extras || []))],
    extrasIds: [],
    conforto: [...new Set(lista.flatMap((item) => item.conforto || []))],
    confortoIds: [],
    deslocacao: lista.some((item) => item.deslocacao),
    comIva: form.comIva.checked,
    linhas,
    total,
    minimo: Math.round(total * 0.9),
    maximo: Math.round(total * 1.12),
    dias,
    fases: fasesObra(dias),
  };
}

function renderProjeto() {
  const lista = lerProjeto();
  const contentor = document.getElementById("projeto-lista");
  const totalBox = document.getElementById("projeto-total");
  document.getElementById("btn-juntar").disabled = lista.length >= 6;
  if (!lista.length) {
    contentor.innerHTML = "<p class='fine'>Ainda não há divisões nesta obra.</p>";
    totalBox.hidden = true;
    totalBox.innerHTML = "";
    return;
  }
  contentor.innerHTML = lista
    .map(
      (item) => `
      <article class="saved-item">
        <div>
          <strong>${escapar(item.titulo)}</strong>
          <p class="fine">${escapar(item.tipo)} · ${item.area} m² · ${euro(item.total)} sem IVA · ${item.dias} dias</p>
        </div>
        <button class="linkish" type="button" data-tirar="${item.id}">Tirar</button>
      </article>`
    )
    .join("");
  const obra = orcamentoProjeto(lista);
  totalBox.hidden = false;
  totalBox.innerHTML = `
    <p><strong>${euro(totalApresentado(obra))}</strong> · ${obra.comIva ? "com IVA" : "sem IVA"} · ${obra.area} m² · ${obra.dias} dias úteis${lista.length > 1 ? " · coordenação −4%" : ""}</p>
    <div class="projeto-acoes">
      <button class="btn btn-small" type="button" id="btn-projeto-imprimir">Imprimir contrato da obra</button>
      <button class="btn btn-small btn-ghost" type="button" id="btn-projeto-copiar">Copiar resumo da obra</button>
    </div>
    <p class="fine" id="projeto-copia"></p>`;
  document.getElementById("btn-projeto-imprimir").addEventListener("click", () => {
    preencherContrato(obra);
    document.getElementById("contrato").hidden = false;
    window.print();
  });
  document.getElementById("btn-projeto-copiar").addEventListener("click", async () => {
    const destino = document.getElementById("projeto-copia");
    try {
      await navigator.clipboard.writeText(resumoTexto(obra));
      destino.textContent = "Resumo da obra copiado.";
    } catch {
      destino.textContent = "Não foi possível copiar neste browser.";
    }
  });
}

document.getElementById("btn-juntar").addEventListener("click", () => {
  const lista = lerProjeto();
  if (lista.length >= 6) return;
  lista.push(calcular());
  escreverProjeto(lista);
  renderProjeto();
});

document.getElementById("projeto-lista").addEventListener("click", (evento) => {
  const id = evento.target.dataset.tirar;
  if (!id) return;
  escreverProjeto(lerProjeto().filter((item) => item.id !== id));
  renderProjeto();
});

document.getElementById("btn-limpar-projeto").addEventListener("click", () => {
  escreverProjeto([]);
  renderProjeto();
});

function classificarZona(texto) {
  const q = normalizarPergunta(texto).trim();
  if (q.length < 3) return null;
  const nomes = ZONAS.flatMap((zona) => zona.nomes.map((nome) => ({ nome: normalizarPergunta(nome), zona })));
  const direto = nomes
    .filter(({ nome }) => q === nome || q.includes(nome))
    .sort((a, b) => b.nome.length - a.nome.length)[0];
  if (direto) return direto.zona;
  const parciais = nomes.filter(({ nome }) => q.length >= 4 && nome.includes(q));
  const grupos = new Set(parciais.map(({ zona }) => zona.grupo));
  if (parciais.length === 1 || grupos.size === 1) return parciais[0].zona;
  if (parciais.length > 1) return { grupo: "ambiguo" };
  return { grupo: "fora" };
}

document.getElementById("form-zona").addEventListener("submit", (evento) => {
  evento.preventDefault();
  const lugar = String(new FormData(evento.target).get("lugar") || "");
  const zona = classificarZona(lugar);
  const caixa = document.getElementById("zona-resultado");
  caixa.hidden = false;
  if (!zona) {
    caixa.innerHTML = "<p>Escreva o concelho ou a freguesia.</p>";
    return;
  }
  if (zona.grupo === "ambiguo") {
    caixa.innerHTML = `<p>Há mais do que uma zona com «${escapar(lugar)}». Escreva o concelho completo, por exemplo Oliveira do Douro ou Oliveira de Azeméis.</p>`;
    return;
  }
  if (zona.grupo === "incluida") {
    form.deslocacao.checked = false;
    renderEstimativa(calcular());
    guardarRascunho();
    caixa.innerHTML = `<p><strong>${escapar(lugar)}</strong> entra na área habitual. A deslocação está incluída e a visita técnica é gratuita.</p>`;
    return;
  }
  if (zona.grupo === "limite") {
    caixa.innerHTML = `<p><strong>${escapar(lugar)}</strong> fica no limite da área. A visita é gratuita. A obra soma ${euro(DESLOCACAO)} de deslocação.</p><button type="button" id="zona-incluir">Incluir ${euro(DESLOCACAO)} na estimativa</button>`;
    document.getElementById("zona-incluir").addEventListener("click", () => {
      form.deslocacao.checked = true;
      renderEstimativa(calcular());
      guardarRascunho();
      document.getElementById("orcamento").scrollIntoView({ behavior: "smooth" });
    });
    return;
  }
  caixa.innerHTML = `<p><strong>${escapar(lugar)}</strong> fica fora do mapa habitual. Deixe o pedido de contacto e confirmamos se o deslocamento é possível.</p><a class="btn btn-small" href="#contacto">Pedir confirmação</a>`;
});

function dataIso(data) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
}

function montarAgenda() {
  const contentor = document.getElementById("agenda-visita");
  const cursor = new Date();
  cursor.setDate(cursor.getDate() + 1);
  const dias = [];
  while (dias.length < 8) {
    const semana = cursor.getDay();
    if (semana !== 0 && semana !== 6) dias.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  contentor.innerHTML = dias
    .map((dia) => {
      const rotulo = dia.toLocaleDateString("pt-PT", { weekday: "short", day: "numeric", month: "short" });
      return `<button type="button" data-dia="${dataIso(dia)}">${escapar(rotulo)}</button>`;
    })
    .join("");
}

document.getElementById("agenda-visita").addEventListener("click", (evento) => {
  const dia = evento.target.dataset.dia;
  if (!dia) return;
  contactForm.dataVisita.value = dia;
  document.querySelectorAll("#agenda-visita button").forEach((botao) => {
    botao.classList.toggle("ativo", botao.dataset.dia === dia);
  });
});

function aplicarPartilha() {
  const params = new URLSearchParams(location.search);
  if (!params.has("tipo")) return;
  const tipo = params.get("tipo");
  if (TIPOS.some((item) => item.id === tipo)) tipoSelect.value = tipo;
  const area = Number(params.get("area"));
  if (area) form.area.value = String(Math.min(400, Math.max(4, Math.round(area))));
  form.comprimento.value = "";
  form.largura.value = "";
  const qualidade = params.get("q");
  if (QUALIDADE[qualidade]) form.qualidade.value = qualidade;
  const extras = (params.get("ex") || "").split(",").filter(Boolean);
  const conforto = (params.get("cf") || "").split(",").filter(Boolean);
  form.querySelectorAll('[name="extras"]').forEach((el) => {
    el.checked = extras.includes(el.value);
  });
  form.querySelectorAll('[name="conforto"]').forEach((el) => {
    el.checked = conforto.includes(el.value);
  });
  form.comIva.checked = params.get("iva") === "1";
  form.deslocacao.checked = params.get("d") === "1";
  form.titulo.value = params.get("t") || "";
}

const lightbox = document.getElementById("lightbox");
let lightboxIndice = 0;

function figurasVisiveis() {
  return [...document.querySelectorAll(".gallery figure")].filter((figura) => !figura.hidden);
}

function abrirLightbox(indice) {
  const figuras = figurasVisiveis();
  if (!figuras.length) return;
  lightboxIndice = (indice + figuras.length) % figuras.length;
  const figura = figuras[lightboxIndice];
  const img = figura.querySelector(".ba-depois") || figura.querySelector("img");
  const destino = document.getElementById("lightbox-img");
  destino.src = img.currentSrc || img.src;
  destino.alt = img.alt;
  document.getElementById("lightbox-cap").textContent = figura.querySelector("figcaption")?.textContent || "";
  lightbox.hidden = false;
}

function fecharLightbox() {
  lightbox.hidden = true;
}

document.getElementById("filtros-obra").addEventListener("click", (evento) => {
  const botao = evento.target.closest("button");
  if (!botao) return;
  document.querySelectorAll("#filtros-obra button").forEach((el) => el.classList.toggle("ativo", el === botao));
  document.querySelectorAll(".gallery figure").forEach((figura) => {
    figura.hidden = botao.dataset.filtro !== "todas" && figura.dataset.tipo !== botao.dataset.filtro;
  });
});

document.querySelector(".gallery").addEventListener("click", (evento) => {
  if (evento.target.closest("input")) return;
  if (evento.target.tagName !== "IMG" && !evento.target.closest("figcaption")) return;
  const figura = evento.target.closest("figure");
  if (!figura) return;
  abrirLightbox(figurasVisiveis().indexOf(figura));
});

document.getElementById("lightbox-fechar").addEventListener("click", fecharLightbox);
document.getElementById("lightbox-prev").addEventListener("click", () => abrirLightbox(lightboxIndice - 1));
document.getElementById("lightbox-next").addEventListener("click", () => abrirLightbox(lightboxIndice + 1));
lightbox.addEventListener("click", (evento) => {
  if (evento.target === lightbox) fecharLightbox();
});

const palcoAntes = document.querySelector(".ba");
const faixaAntes = palcoAntes.querySelector(".ba-antes");
const rangeAntes = palcoAntes.querySelector("input");
function sincronizarAntes() {
  palcoAntes.style.setProperty("--ba-w", `${palcoAntes.clientWidth}px`);
  faixaAntes.style.width = `${rangeAntes.value}%`;
}
rangeAntes.addEventListener("input", sincronizarAntes);
window.addEventListener("resize", sincronizarAntes);
sincronizarAntes();

const hojeVisita = new Date();
contactForm.dataVisita.min = `${hojeVisita.getFullYear()}-${String(hojeVisita.getMonth() + 1).padStart(2, "0")}-${String(hojeVisita.getDate()).padStart(2, "0")}`;
restaurarRascunho();
aplicarPartilha();
renderEstimativa(calcular());
renderGuardados();
renderProjeto();
montarAgenda();

const assistentePainel = document.getElementById("assistente-painel");
const assistenteAbrir = document.getElementById("assistente-abrir");
const assistenteMsgs = document.getElementById("assistente-msgs");
const assistenteForm = document.getElementById("assistente-form");
const assistenteInput = document.getElementById("assistente-input");
let assistenteAberto = false;

function normalizarPergunta(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function textoEstimativa() {
  if (!ultimoOrcamento) {
    return "Ainda não há uma estimativa aberta. Pode defini-la no simulador, por tipo de obra, área e acabamento.";
  }
  return `Na estimativa aberta, «${ultimoOrcamento.titulo}», o valor de referência é ${euro(ultimoOrcamento.total)}, com intervalo de ${euro(ultimoOrcamento.minimo)} a ${euro(ultimoOrcamento.maximo)}, e o prazo é de ${ultimoOrcamento.dias} dias úteis.`;
}

const ATENDIMENTO = [
  {
    chaves: ["prazo", "dias", "demora", "calendario", "quando fica", "duracao"],
    responder: () =>
      `O prazo conta em dias úteis e começa no dia útil seguinte à receção do sinal e da autorização de início. Sábados, domingos e feriados não entram, salvo acordo escrito. A obra reparte-se em preparação, instalações, acabamentos e entrega, com um ponto de situação no fim de cada semana.\n\n${textoEstimativa()}`,
  },
  {
    chaves: ["preco", "valor", "orcamento", "custo", "quanto", "simulador", "iva"],
    responder: () =>
      `O simulador dá uma estimativa sem IVA para planear o investimento. O valor definitivo sai da visita técnica, com medidas e estado real da casa. O mapa inclui mão de obra, materiais da linha escolhida, gestão de obra e limpeza final.\n\n${textoEstimativa()}`,
  },
  {
    chaves: ["pagamento", "pagar", "sinal", "tranche", "prestac"],
    responder: () =>
      "O pagamento segue marcos da obra: sinal na adjudicação, antes do início; uma tranche quando as instalações ficam concluídas; outra após os acabamentos; e o saldo na entrega, com checklist assinado. Na minuta impressa estes valores já vêm calculados sobre a estimativa.",
  },
  {
    chaves: ["inclui", "incluido", "exclus", "fora", "materiais", "mao de obra"],
    responder: () =>
      "Está incluído o que consta do mapa: mão de obra, materiais da linha de acabamento, gestão de obra e limpeza final. Licenças, mobiliário não listado, trabalhos ocultos e alterações pedidas a meio da obra são orçamentados à parte e só avançam com acordo escrito.",
  },
  {
    chaves: ["garantia", "checklist", "entrega"],
    responder: () =>
      "A execução tem garantia de 5 anos. Na entrega fazemos a checklist com as duas partes, a limpeza final e a conferência do que foi contratado.",
  },
  {
    chaves: ["porto", "zona", "foz", "matosinhos", "gaia", "gondomar", "maia", "valongo", "onde"],
    responder: () =>
      "Intervimos no Porto e no Grande Porto: Matosinhos, Gaia, Gondomar, Maia, Valongo e concelhos vizinhos. Fora desta área, avaliamos o deslocamento caso a caso, na visita.",
  },
  {
    chaves: ["visita", "processo", "como funciona", "etapas", "levantamento"],
    responder: () =>
      "O método tem quatro etapas. Primeiro, a visita e o levantamento. Depois, o orçamento formal com mapa, materiais e calendário. Em obra, há um responsável e um ponto de situação semanal. No fim, checklist, limpeza e garantia.",
  },
  {
    chaves: ["contrato", "minuta", "pdf", "imprimir"],
    responder: () =>
      "Em Imprimir / PDF sai a minuta do contrato já preenchida com o objeto, o preço, os dias de obra por fase e os pagamentos por marco. É uma minuta da estimativa: medidas e calendário definitivo confirmam-se na visita.",
  },
  {
    chaves: ["cozinha", "banho", "casa de banho", "interior", "fachada", "integral", "remodel"],
    responder: () =>
      "Executamos cozinhas, casas de banho, interiores, fachadas e remodelações integrais. O âmbito fica por escrito: layout, instalações, revestimentos e o que fica de fora. Pode ajustar o tipo de obra no simulador para ver valor e prazo de referência.",
  },
  {
    chaves: ["acabamento", "essencial", "conforto", "assinatura", "linha"],
    responder: () =>
      "Há três linhas. Essencial, para atualizar com acabamentos sólidos. Conforto, com materiais de linha média-alta e acompanhamento semanal. Assinatura, com peças à medida e direção de obra dedicada. A linha altera o valor e o prazo da estimativa.",
  },
  {
    chaves: ["licenca", "camara", "alvara"],
    responder: () =>
      "Licenças e taxas camarárias não entram no preço do simulador. Quando a intervenção as exige, identificamo-las na visita e orçamentamo-las à parte.",
  },
  {
    chaves: ["morar", "habitar", "casa habitada", "barulho", "horario", "vizinh", "poeira", "sanitario", "provisorio"],
    responder: () =>
      "Em casa habitada, a obra avança por divisões. Pode incluir proteção de pó e móveis, um sanitário provisório e horário reduzido das 9h às 17h. O horário reduzido alonga um pouco o prazo e entra na estimativa. Estas opções estão no simulador e na secção Conforto.",
  },
  {
    chaves: ["iva", "imposto"],
    responder: () =>
      `A estimativa nasce sem IVA. Se ligar «Mostrar valores com IVA (23%)», o total, o intervalo e as rubricas passam a mostrar o imposto à parte.\n\n${textoEstimativa()}`,
  },
  {
    chaves: ["whatsapp", "partilhar", "copiar", "medidas", "comprimento", "largura", "area"],
    responder: () =>
      "Pode indicar comprimento e largura para a área se calcular sozinha. O resumo da estimativa copia-se ou segue no WhatsApp, e o rascunho fica guardado neste dispositivo para continuar mais tarde.",
  },
  {
    chaves: ["visita", "dia", "horario da visita", "marcar", "manha", "tarde"],
    responder: () =>
      "No pedido de contacto pode escolher o dia e um período: manhã, 9h–12h; tarde, 14h–17h; ou fim de tarde, 17h–19h. Também indica se prefere telefone, WhatsApp ou email.",
  },
  {
    chaves: ["zona", "concelho", "freguesia", "deslocacao", "deslocamento", "espinho", "vila do conde", "povoa"],
    responder: () =>
      "No Porto, Matosinhos, Gaia, Gondomar, Maia e Valongo a deslocação está incluída. Em concelhos limítrofes, como Espinho, Vila do Conde, Póvoa de Varzim ou Santo Tirso, a visita continua gratuita e a obra soma 180 €. Pode confirmar a zona na secção do mapa e incluir esse valor na estimativa.",
  },
  {
    chaves: ["prestacao", "prestacoes", "meses", "financi", "sinal de"],
    responder: () =>
      "O pagamento segue marcos: 30% de sinal, 30% com as instalações concluídas, 25% após os acabamentos e o saldo na entrega. No simulador pode ver o restante, depois do sinal, em 3, 6 ou 10 meses, sem juros. Essa repartição é uma simulação até o orçamento formal fechar o calendário.",
  },
  {
    chaves: ["divisoes", "divisao", "varias", "juntar", "cozinha e banho", "mais do que uma"],
    responder: () =>
      "Pode juntar várias divisões na mesma obra. Cada uma guarda o seu valor e, a partir da segunda, há 4% de coordenação. O prazo não soma os dias todos: a divisão mais longa marca a base e as outras entram com sobreposição de equipas.",
  },
  {
    chaves: ["antes", "depois", "galeria", "portfolio", "fotograf"],
    responder: () =>
      "Na obra recente pode filtrar por cozinha, casa de banho, interior ou exterior. Na cozinha de Cedofeita o comparador mostra o antes e o depois. Um clique na fotografia abre-a em grande.",
  },
  {
    chaves: ["contacto", "telefone", "email", "falar", "pessoa", "visita tecnica"],
    responder: () =>
      "Para um caso concreto, o passo seguinte é a visita técnica. Pode deixar nome, telefone e a dúvida no formulário de contacto. O escritório de demonstração está na Rua de Cedofeita 248, Porto.",
  },
];

function responderDuvida(texto) {
  const pergunta = normalizarPergunta(texto);
  if (/^(ola|oi|bom dia|boa tarde|boa noite)\b/.test(pergunta)) {
    return "Bom dia. Posso esclarecer prazo, preço, pagamentos, o que está incluído, garantia e a zona de intervenção. Se já tiver uma estimativa aberta, uso esses números na resposta.";
  }
  const pontuadas = ATENDIMENTO.map((item) => ({
    item,
    pontos: item.chaves.reduce((soma, chave) => soma + (pergunta.includes(chave) ? chave.length : 0), 0),
  }))
    .filter((item) => item.pontos > 0)
    .sort((a, b) => b.pontos - a.pontos);

  if (!pontuadas.length) return null;
  const resposta = pontuadas[0].item.responder();
  if (pontuadas[1] && pontuadas[1].pontos >= pontuadas[0].pontos * 0.75) {
    return `${resposta}\n\n${pontuadas[1].item.responder()}`;
  }
  return resposta;
}

function mensagemAtendimento(autor, texto) {
  const bloco = document.createElement("p");
  bloco.className = `assistente-msg assistente-msg-${autor}`;
  bloco.textContent = texto;
  assistenteMsgs.append(bloco);
  assistenteMsgs.scrollTop = assistenteMsgs.scrollHeight;
  return bloco;
}

function passarDuvida(texto) {
  contactForm.mensagem.value = `Dúvida pelo atendimento: ${texto}`;
  document.getElementById("anexar-orcamento").checked = true;
  fecharAtendimento();
  document.getElementById("contacto").scrollIntoView({ behavior: "smooth" });
  contactForm.nome.focus();
}

function tratarPergunta(texto) {
  const pergunta = texto.trim();
  if (!pergunta) return;
  mensagemAtendimento("cliente", pergunta);
  const resposta = responderDuvida(pergunta);
  if (resposta) {
    mensagemAtendimento("casa", resposta);
    return;
  }
  mensagemAtendimento(
    "casa",
    "Para não avançar com uma informação incompleta, esta questão deve ir para a visita técnica. Posso passá-la ao pedido de contacto, juntamente com a estimativa aberta."
  );
  const passar = document.createElement("button");
  passar.type = "button";
  passar.className = "assistente-passar";
  passar.textContent = "Passar esta dúvida ao pedido";
  passar.addEventListener("click", () => passarDuvida(pergunta));
  assistenteMsgs.append(passar);
  assistenteMsgs.scrollTop = assistenteMsgs.scrollHeight;
}

function abrirAtendimento() {
  assistenteAberto = true;
  assistentePainel.hidden = false;
  assistenteAbrir.setAttribute("aria-expanded", "true");
  assistenteAbrir.hidden = true;
  if (!assistenteMsgs.childElementCount) {
    mensagemAtendimento(
      "casa",
      "Sou o atendimento de obra da Minutos Determinantes. Diga o que precisa de saber sobre prazo, preço, pagamentos ou execução. Se o simulador já tiver uma estimativa, respondo com esses valores."
    );
  }
  assistenteInput.focus();
}

function fecharAtendimento() {
  assistenteAberto = false;
  assistentePainel.hidden = true;
  assistenteAbrir.hidden = false;
  assistenteAbrir.setAttribute("aria-expanded", "false");
  assistenteAbrir.focus();
}

["Qual é o prazo da obra?", "Como se paga?", "Chegam à minha zona?", "Posso juntar divisões?"].forEach((sugestao) => {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.textContent = sugestao;
  botao.addEventListener("click", () => tratarPergunta(sugestao));
  document.getElementById("assistente-sugestoes").append(botao);
});

assistenteAbrir.addEventListener("click", abrirAtendimento);
document.getElementById("assistente-fechar").addEventListener("click", fecharAtendimento);
assistenteForm.addEventListener("submit", (evento) => {
  evento.preventDefault();
  tratarPergunta(assistenteInput.value);
  assistenteForm.reset();
});
document.addEventListener("keydown", (evento) => {
  if (evento.key === "Escape" && !lightbox.hidden) {
    fecharLightbox();
    return;
  }
  if (evento.key === "ArrowLeft" && !lightbox.hidden) abrirLightbox(lightboxIndice - 1);
  if (evento.key === "ArrowRight" && !lightbox.hidden) abrirLightbox(lightboxIndice + 1);
  if (evento.key === "Escape" && assistenteAberto) fecharAtendimento();
});
