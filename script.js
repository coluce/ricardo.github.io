async function carregarPagina(pagina) {
    const conteudo = document.getElementById("conteudo");

    try {
        const resposta = await fetch(`pages/${pagina}.html`);
        
        if (!resposta.ok) {
            conteudo.innerHTML = "<h1>Erro 404</h1><p>Vixi, o bagúio num tá lá!</p>";
            return;
        }

        const html = await resposta.text();
        conteudo.innerHTML = html;

        // Inicializar categorias se a página carregada for categorias
        if (pagina === 'categorias') {
            inicializarCategorias();
            renderizarTabela();
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
