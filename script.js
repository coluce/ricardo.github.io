async function carregarPagina(pagina) {
    const conteudo = document.getElementById("conteudo");

    try {
        // Construir URL absoluto para evitar problemas com caminhos relativos
        const url = new URL(`pages/${pagina}.html`, window.location.href).href;
        let resposta;
        try {
            resposta = await fetch(url);
        } catch (fetchError) {
            conteudo.innerHTML = `<h1>Erro</h1><p>Deu zica lendo o trêm.</p>`;
            console.error('Erro ao fazer fetch para', url, fetchError);
            return;
        }

        if (!resposta.ok) {
            conteudo.innerHTML = `<h1>Erro ${resposta.status}</h1><p>Não foi possível carregar a página (${resposta.statusText}).</p>`;
            console.error('Resposta não OK ao carregar', url, resposta.status, resposta.statusText);
            return;
        }

        const html = await resposta.text();
        conteudo.innerHTML = html;

        // Inicializar categorias e fornecedores quando suas páginas forem carregadas
        if (pagina === 'categorias') {
            inicializarCategorias();
            renderizarTabela();
        }

        if (pagina === 'fornecedores') {
            inicializarFornecedores();
            renderizarTabelaFornecedores();
        }

        if (pagina === 'lancamentos') {
            inicializarLancamentos();
            renderizarTabelaLancamentos();
        }

    } catch (erro) {
        conteudo.innerHTML = "<h1>Erro</h1><p>Deu zica lendo o trêm.</p>";
        console.error("Num foi:", erro);
    }
}

// Carrega a página inicial quando o site abre
document.addEventListener('DOMContentLoaded', function() {
    carregarPagina('home');
});

// Variáveis de edição (mantidas no escopo global)
let idEmEdicao = null;
let idEmEdicaoFornecedor = null;

// ==================== FUNÇÕES PARA CRUD DE CATEGORIAS ====================

// Inicializa as categorias no localStorage se não existirem
function inicializarCategorias() {
    if (!localStorage.getItem('categorias')) {
        const categoriasIniciais = [];
        localStorage.setItem('categorias', JSON.stringify(categoriasIniciais));
        localStorage.setItem('proximoIdCategoria', '1');
    }
}

// Carrega as categorias do localStorage
function carregarCategorias() {
    const dados = localStorage.getItem('categorias');
    return dados ? JSON.parse(dados) : [];
}

// Salva as categorias no localStorage
function salvarCategorias(categorias) {
    localStorage.setItem('categorias', JSON.stringify(categorias));
}

// Obtém o próximo ID disponível
function obterProximoId() {
    let proximoId = parseInt(localStorage.getItem('proximoIdCategoria')) || 1;
    localStorage.setItem('proximoIdCategoria', (proximoId + 1).toString());
    return proximoId;
}

// Renderiza a tabela com as categorias
function renderizarTabela() {
    const categorias = carregarCategorias();
    const corpo = document.getElementById('corpoCategorias');
    const mensagem = document.getElementById('mensagemVazia');
    
    if (!corpo) return; // Página não está carregada

    corpo.innerHTML = '';

    if (categorias.length === 0) {
        if (mensagem) mensagem.style.display = 'block';
        return;
    }

    if (mensagem) mensagem.style.display = 'none';

    categorias.forEach(categoria => {
        const linha = document.createElement('tr');
        linha.innerHTML = `
            <td>${categoria.id}</td>
            <td>${categoria.nome}</td>
            <td><span class="badge badge-${categoria.tipo.toLowerCase()}">${categoria.tipo}</span></td>
            <td>
                <button class="btn btn-sm btn-edit" onclick="abrirModalEdicao(${categoria.id})">Editar</button>
                <button class="btn btn-sm btn-delete" onclick="deletarCategoria(${categoria.id})">Deletar</button>
            </td>
        `;
        corpo.appendChild(linha);
    });
}

// Adiciona uma nova categoria
function adicionarCategoria(event) {
    event.preventDefault();
    
    const nome = document.getElementById('inputNome').value.trim();
    const tipo = document.getElementById('selectTipo').value;

    // Validações
    if (!nome) {
        alert('O nome da categoria não pode estar vazio!');
        return;
    }

    if (!tipo) {
        alert('Selecione um tipo válido!');
        return;
    }

    // Carrega as categorias antes de validar duplicata
    const categorias = carregarCategorias();

    // Validar se já existe categoria com o mesmo nome
    if (categorias.some(c => c.nome.toLowerCase() === nome.toLowerCase())) {
        alert('Já existe uma categoria com este nome!');
        return;
    }

    // Criar nova categoria
    const novaCategoria = {
        id: obterProximoId(),
        nome: nome,
        tipo: tipo
    };

    // Adicionar à lista
    categorias.push(novaCategoria);
    salvarCategorias(categorias);

    // Limpar formulário
    document.getElementById('formCategoria').reset();

    // Atualizar tabela
    renderizarTabela();
}

// Abre o modal para editar uma categoria
function abrirModalEdicao(id) {
    const categorias = carregarCategorias();
    const categoria = categorias.find(c => c.id === id);

    if (!categoria) {
        alert('Categoria não encontrada!');
        return;
    }

    idEmEdicao = id;
    document.getElementById('editNome').value = categoria.nome;
    document.getElementById('editTipo').value = categoria.tipo;

    const modal = document.getElementById('modalEdicao');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Fecha o modal de edição
function fecharModalEdicao(event) {
    // Se clicar no backdrop (fora do modal), fecha
    if (event && event.target.id === 'modalEdicao') {
        const modal = document.getElementById('modalEdicao');
        if (modal) {
            modal.style.display = 'none';
        }
        idEmEdicao = null;
    }
    // Se clicar no botão X ou Cancelar
    else if (!event || event.target.classList.contains('modal-close') || event.target.textContent === 'Cancelar') {
        const modal = document.getElementById('modalEdicao');
        if (modal) {
            modal.style.display = 'none';
        }
        idEmEdicao = null;
    }
}

// Salva a edição de uma categoria
function salvarEdicao(event) {
    event.preventDefault();

    const nome = document.getElementById('editNome').value.trim();
    const tipo = document.getElementById('editTipo').value;

    // Validações
    if (!nome) {
        alert('O nome da categoria não pode estar vazio!');
        return;
    }

    if (!tipo) {
        alert('Selecione um tipo válido!');
        return;
    }

    // Atualizar categoria
    const categorias = carregarCategorias();
    const index = categorias.findIndex(c => c.id === idEmEdicao);

    if (index !== -1) {
        categorias[index].nome = nome;
        categorias[index].tipo = tipo;
        salvarCategorias(categorias);
    }

    // Fechar modal
    const modal = document.getElementById('modalEdicao');
    if (modal) {
        modal.style.display = 'none';
    }
    idEmEdicao = null;

    // Atualizar tabela
    renderizarTabela();
}

// Deleta uma categoria com confirmação
function deletarCategoria(id) {
    if (confirm('Tem certeza que deseja deletar esta categoria?')) {
        const categorias = carregarCategorias();
        const categoriasAtualizadas = categorias.filter(c => c.id !== id);
        salvarCategorias(categoriasAtualizadas);
        renderizarTabela();
    }
}

// ==================== FUNÇÕES PARA CRUD DE FORNECEDORES ====================

// Inicializa os fornecedores no localStorage se não existirem
function inicializarFornecedores() {
    if (!localStorage.getItem('fornecedores')) {
        localStorage.setItem('fornecedores', JSON.stringify([]));
        localStorage.setItem('proximoIdFornecedor', '1');
    }
}

// Carrega os fornecedores do localStorage
function carregarFornecedores() {
    const dados = localStorage.getItem('fornecedores');
    return dados ? JSON.parse(dados) : [];
}

// Salva os fornecedores no localStorage
function salvarFornecedores(fornecedores) {
    localStorage.setItem('fornecedores', JSON.stringify(fornecedores));
}

// Obtém o próximo ID disponível para fornecedor
function obterProximoIdFornecedor() {
    let proximoId = parseInt(localStorage.getItem('proximoIdFornecedor')) || 1;
    localStorage.setItem('proximoIdFornecedor', (proximoId + 1).toString());
    return proximoId;
}

// Renderiza a tabela com os fornecedores
function renderizarTabelaFornecedores() {
    const fornecedores = carregarFornecedores();
    const corpo = document.getElementById('corpoFornecedores');
    const mensagem = document.getElementById('mensagemVaziaFornecedores');
    
    if (!corpo) return; // Página não está carregada

    corpo.innerHTML = '';

    if (fornecedores.length === 0) {
        if (mensagem) mensagem.style.display = 'block';
        return;
    }

    if (mensagem) mensagem.style.display = 'none';

    fornecedores.forEach(f => {
        const linha = document.createElement('tr');
        linha.innerHTML = `
            <td>${f.id}</td>
            <td>${f.nome}</td>
            <td>
                <button class="btn btn-sm btn-edit" onclick="abrirModalEdicaoFornecedor(${f.id})">Editar</button>
                <button class="btn btn-sm btn-delete" onclick="deletarFornecedor(${f.id})">Deletar</button>
            </td>
        `;
        corpo.appendChild(linha);
    });
}

// Adiciona um novo fornecedor
function adicionarFornecedor(event) {
    event.preventDefault();

    const nome = document.getElementById('inputNomeFornecedor').value.trim();

    // Validações
    if (!nome) {
        alert('O nome do fornecedor não pode estar vazio!');
        return;
    }

    // Carrega os fornecedores antes de validar duplicata
    const fornecedores = carregarFornecedores();

    // Validar se já existe fornecedor com o mesmo nome
    if (fornecedores.some(f => f.nome.toLowerCase() === nome.toLowerCase())) {
        alert('Já existe um fornecedor com este nome!');
        return;
    }

    // Criar novo fornecedor
    const novoFornecedor = {
        id: obterProximoIdFornecedor(),
        nome: nome
    };

    // Adicionar à lista
    fornecedores.push(novoFornecedor);
    salvarFornecedores(fornecedores);

    // Limpar formulário
    document.getElementById('formFornecedor').reset();

    // Atualizar tabela
    renderizarTabelaFornecedores();
}

// Abre o modal para editar um fornecedor
function abrirModalEdicaoFornecedor(id) {
    const fornecedores = carregarFornecedores();
    const fornecedor = fornecedores.find(f => f.id === id);

    if (!fornecedor) {
        alert('Fornecedor não encontrado!');
        return;
    }

    idEmEdicaoFornecedor = id;
    document.getElementById('editNomeFornecedor').value = fornecedor.nome;

    const modal = document.getElementById('modalEdicaoFornecedor');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Fecha o modal de edição de fornecedor
function fecharModalEdicaoFornecedor(event) {
    // Se clicar no backdrop (fora do modal), fecha
    if (event && event.target.id === 'modalEdicaoFornecedor') {
        const modal = document.getElementById('modalEdicaoFornecedor');
        if (modal) {
            modal.style.display = 'none';
        }
        idEmEdicaoFornecedor = null;
    }
    // Se clicar no botão X ou Cancelar
    else if (!event || event.target.classList.contains('modal-close') || event.target.textContent === 'Cancelar') {
        const modal = document.getElementById('modalEdicaoFornecedor');
        if (modal) {
            modal.style.display = 'none';
        }
        idEmEdicaoFornecedor = null;
    }
}

// Salva a edição de um fornecedor
function salvarEdicaoFornecedor(event) {
    event.preventDefault();

    const nome = document.getElementById('editNomeFornecedor').value.trim();

    // Validações
    if (!nome) {
        alert('O nome do fornecedor não pode estar vazio!');
        return;
    }

    // Atualizar fornecedor
    const fornecedores = carregarFornecedores();
    const index = fornecedores.findIndex(f => f.id === idEmEdicaoFornecedor);

    if (index !== -1) {
        // Verificar duplicata (exceto o próprio registro)
        if (fornecedores.some((f, idx) => idx !== index && f.nome.toLowerCase() === nome.toLowerCase())) {
            alert('Já existe outro fornecedor com este nome!');
            return;
        }

        fornecedores[index].nome = nome;
        salvarFornecedores(fornecedores);
    }

    // Fechar modal
    const modal = document.getElementById('modalEdicaoFornecedor');
    if (modal) {
        modal.style.display = 'none';
    }
    idEmEdicaoFornecedor = null;

    // Atualizar tabela
    renderizarTabelaFornecedores();
}

// Deleta um fornecedor com confirmação
function deletarFornecedor(id) {
    if (confirm('Tem certeza que deseja deletar este fornecedor?')) {
        const fornecedores = carregarFornecedores();
        const fornecedoresAtualizados = fornecedores.filter(f => f.id !== id);
        salvarFornecedores(fornecedoresAtualizados);
        renderizarTabelaFornecedores();
    }
}

// ==================== FUNÇÕES PARA CRUD DE LANÇAMENTOS ====================

// Variável para rastrear ID em edição
let idEmEdicaoLancamento = null;

// Inicializa os lançamentos no localStorage se não existirem
function inicializarLancamentos() {
    if (!localStorage.getItem('lancamentos')) {
        localStorage.setItem('lancamentos', JSON.stringify([]));
        localStorage.setItem('proximoIdLancamento', '1');
    }
}

// Carrega os lançamentos do localStorage
function carregarLancamentos() {
    const dados = localStorage.getItem('lancamentos');
    return dados ? JSON.parse(dados) : [];
}

// Salva os lançamentos no localStorage
function salvarLancamentos(lancamentos) {
    localStorage.setItem('lancamentos', JSON.stringify(lancamentos));
}

// Obtém o próximo ID disponível para lançamento
function obterProximoIdLancamento() {
    let proximoId = parseInt(localStorage.getItem('proximoIdLancamento')) || 1;
    localStorage.setItem('proximoIdLancamento', (proximoId + 1).toString());
    return proximoId;
}

// Obter nome da categoria por ID
function obterNomeCategoria(id) {
    const categorias = carregarCategorias();
    const categoria = categorias.find(c => c.id === id);
    return categoria ? categoria.nome : 'N/A';
}

// Obter nome do fornecedor por ID
function obterNomeFornecedor(id) {
    const fornecedores = carregarFornecedores();
    const fornecedor = fornecedores.find(f => f.id === id);
    return fornecedor ? fornecedor.nome : 'N/A';
}

// Renderiza a tabela com os lançamentos
function renderizarTabelaLancamentos() {
    const lancamentos = carregarLancamentos();
    const corpo = document.getElementById('corpoLancamentos');
    const mensagem = document.getElementById('mensagemVaziaLancamentos');
    
    if (!corpo) return; // Página não está carregada

    // Preencher combos de categoria e fornecedor
    preencherSelectsCategoriaFornecedor();

    corpo.innerHTML = '';

    if (lancamentos.length === 0) {
        if (mensagem) mensagem.style.display = 'block';
        return;
    }

    if (mensagem) mensagem.style.display = 'none';

    lancamentos.forEach(l => {
        const linha = document.createElement('tr');
        const badgeStatus = l.status === 'Pago' ? 'badge-receita' : 'badge-despesa';
        linha.innerHTML = `
            <td>${l.id}</td>
            <td>R$ ${parseFloat(l.valorBruto).toFixed(2)}</td>
            <td>R$ ${parseFloat(l.desconto).toFixed(2)}</td>
            <td>R$ ${parseFloat(l.acrescimo).toFixed(2)}</td>
            <td><strong>R$ ${parseFloat(l.valorLiquido).toFixed(2)}</strong></td>
            <td><span class="badge ${badgeStatus}">${l.status}</span></td>
            <td>${new Date(l.dataLancamento).toLocaleDateString('pt-BR')}</td>
            <td>${new Date(l.dataVencimento).toLocaleDateString('pt-BR')}</td>
            <td>${l.dataPagamento ? new Date(l.dataPagamento).toLocaleDateString('pt-BR') : '-'}</td>
            <td>${obterNomeCategoria(l.categoriaId)}</td>
            <td>${obterNomeFornecedor(l.fornecedorId)}</td>
            <td>
                <button class="btn btn-sm btn-edit" onclick="abrirModalEdicaoLancamento(${l.id})">Editar</button>
                <button class="btn btn-sm btn-delete" onclick="deletarLancamento(${l.id})">Deletar</button>
            </td>
        `;
        corpo.appendChild(linha);
    });
}

// Adiciona um novo lançamento
function adicionarLancamento(event) {
    event.preventDefault();

    const valorBruto = parseFloat(document.getElementById('inputValorBruto').value);
    const desconto = parseFloat(document.getElementById('inputDesconto').value) || 0;
    const acrescimo = parseFloat(document.getElementById('inputAcrescimo').value) || 0;
    const status = document.getElementById('selectStatus').value;
    const dataLancamento = document.getElementById('inputDataLancamento').value;
    const dataVencimento = document.getElementById('inputDataVencimento').value;
    const dataPagamento = document.getElementById('inputDataPagamento').value;
    const categoriaId = parseInt(document.getElementById('selectCategoria').value);
    const fornecedorId = parseInt(document.getElementById('selectFornecedor').value);

    // Validações
    if (!valorBruto || valorBruto <= 0) {
        alert('O valor bruto deve ser maior que zero!');
        return;
    }

    if (!status) {
        alert('Selecione um status!');
        return;
    }

    if (!dataLancamento) {
        alert('Selecione a data de lançamento!');
        return;
    }

    if (!dataVencimento) {
        alert('Selecione a data de vencimento!');
        return;
    }

    if (status === 'Pago' && !dataPagamento) {
        alert('Data de pagamento é obrigatória para lançamentos pagos!');
        return;
    }

    if (!categoriaId) {
        alert('Selecione uma categoria!');
        return;
    }

    if (!fornecedorId) {
        alert('Selecione um fornecedor!');
        return;
    }

    // Criar novo lançamento
    const novoLancamento = {
        id: obterProximoIdLancamento(),
        valorBruto: valorBruto,
        desconto: desconto,
        acrescimo: acrescimo,
        valorLiquido: valorBruto - desconto + acrescimo,
        status: status,
        dataLancamento: dataLancamento,
        dataVencimento: dataVencimento,
        dataPagamento: dataPagamento || null,
        categoriaId: categoriaId,
        fornecedorId: fornecedorId
    };

    // Adicionar à lista
    const lancamentos = carregarLancamentos();
    lancamentos.push(novoLancamento);
    salvarLancamentos(lancamentos);

    // Limpar formulário
    document.getElementById('formLancamento').reset();
    document.getElementById('inputValorLiquido').value = '0.00';
    document.getElementById('grupoPagamento').style.display = 'none';

    // Atualizar tabela
    renderizarTabelaLancamentos();
}

// Abre o modal para editar um lançamento
function abrirModalEdicaoLancamento(id) {
    const lancamentos = carregarLancamentos();
    const lancamento = lancamentos.find(l => l.id === id);

    if (!lancamento) {
        alert('Lançamento não encontrado!');
        return;
    }

    idEmEdicaoLancamento = id;
    
    // Preencher campos
    document.getElementById('editValorBruto').value = lancamento.valorBruto;
    document.getElementById('editDesconto').value = lancamento.desconto;
    document.getElementById('editAcrescimo').value = lancamento.acrescimo;
    document.getElementById('editValorLiquido').value = lancamento.valorLiquido.toFixed(2);
    document.getElementById('editStatus').value = lancamento.status;
    document.getElementById('editDataLancamento').value = lancamento.dataLancamento;
    document.getElementById('editDataVencimento').value = lancamento.dataVencimento;
    document.getElementById('editDataPagamento').value = lancamento.dataPagamento || '';
    document.getElementById('editCategoria').value = lancamento.categoriaId;
    document.getElementById('editFornecedor').value = lancamento.fornecedorId;

    // Mostrar/esconder data de pagamento
    atualizarVisibilidadePagamentoModal();

    const modal = document.getElementById('modalEdicaoLancamento');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Fecha o modal de edição de lançamento
function fecharModalEdicaoLancamento(event) {
    // Se clicar no backdrop (fora do modal), fecha
    if (event && event.target.id === 'modalEdicaoLancamento') {
        const modal = document.getElementById('modalEdicaoLancamento');
        if (modal) {
            modal.style.display = 'none';
        }
        idEmEdicaoLancamento = null;
    }
    // Se clicar no botão X ou Cancelar
    else if (!event || event.target.classList.contains('modal-close') || event.target.textContent === 'Cancelar') {
        const modal = document.getElementById('modalEdicaoLancamento');
        if (modal) {
            modal.style.display = 'none';
        }
        idEmEdicaoLancamento = null;
    }
}

// Salva a edição de um lançamento
function salvarEdicaoLancamento(event) {
    event.preventDefault();

    const valorBruto = parseFloat(document.getElementById('editValorBruto').value);
    const desconto = parseFloat(document.getElementById('editDesconto').value) || 0;
    const acrescimo = parseFloat(document.getElementById('editAcrescimo').value) || 0;
    const status = document.getElementById('editStatus').value;
    const dataLancamento = document.getElementById('editDataLancamento').value;
    const dataVencimento = document.getElementById('editDataVencimento').value;
    const dataPagamento = document.getElementById('editDataPagamento').value;
    const categoriaId = parseInt(document.getElementById('editCategoria').value);
    const fornecedorId = parseInt(document.getElementById('editFornecedor').value);

    // Validações
    if (!valorBruto || valorBruto <= 0) {
        alert('O valor bruto deve ser maior que zero!');
        return;
    }

    if (status === 'Pago' && !dataPagamento) {
        alert('Data de pagamento é obrigatória para lançamentos pagos!');
        return;
    }

    // Atualizar lançamento
    const lancamentos = carregarLancamentos();
    const index = lancamentos.findIndex(l => l.id === idEmEdicaoLancamento);

    if (index !== -1) {
        lancamentos[index].valorBruto = valorBruto;
        lancamentos[index].desconto = desconto;
        lancamentos[index].acrescimo = acrescimo;
        lancamentos[index].valorLiquido = valorBruto - desconto + acrescimo;
        lancamentos[index].status = status;
        lancamentos[index].dataLancamento = dataLancamento;
        lancamentos[index].dataVencimento = dataVencimento;
        lancamentos[index].dataPagamento = dataPagamento || null;
        lancamentos[index].categoriaId = categoriaId;
        lancamentos[index].fornecedorId = fornecedorId;
        
        salvarLancamentos(lancamentos);
    }

    // Fechar modal
    const modal = document.getElementById('modalEdicaoLancamento');
    if (modal) {
        modal.style.display = 'none';
    }
    idEmEdicaoLancamento = null;

    // Atualizar tabela
    renderizarTabelaLancamentos();
}

// Deleta um lançamento com confirmação
function deletarLancamento(id) {
    if (confirm('Tem certeza que deseja deletar este lançamento?')) {
        const lancamentos = carregarLancamentos();
        const lancamentosAtualizados = lancamentos.filter(l => l.id !== id);
        salvarLancamentos(lancamentosAtualizados);
        renderizarTabelaLancamentos();
    }
}

// Preencher selects de categoria e fornecedor
function preencherSelectsCategoriaFornecedor() {
    const categorias = carregarCategorias();
    const fornecedores = carregarFornecedores();

    const selectCategoria = document.getElementById('selectCategoria');
    const editCategoria = document.getElementById('editCategoria');
    
    [selectCategoria, editCategoria].forEach(select => {
        if (!select) return;
        select.innerHTML = '<option value="">-- Selecione uma categoria --</option>';
        categorias.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.nome;
            select.appendChild(option);
        });
    });

    const selectFornecedor = document.getElementById('selectFornecedor');
    const editFornecedor = document.getElementById('editFornecedor');
    
    [selectFornecedor, editFornecedor].forEach(select => {
        if (!select) return;
        select.innerHTML = '<option value="">-- Selecione um fornecedor --</option>';
        fornecedores.forEach(f => {
            const option = document.createElement('option');
            option.value = f.id;
            option.textContent = f.nome;
            select.appendChild(option);
        });
    });
}
