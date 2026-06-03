// ====== BANCO DE DADOS SIMULADO (LocalStorage) ======
// Dados padrão caso seja o primeiro acesso
const produtosIniciais = [
    { id: 1, tipo: 'prato', nome: 'Marmita Tradicional', descricao: 'Arroz, feijão, bife acebolado e fritas', preco: 25.90, imagem: 'https://images.unsplash.com/photo-1628294895950-9805252327bc?auto=format&fit=crop&w=500&q=80' },
    { id: 2, tipo: 'prato', nome: 'Marmita Fit', descricao: 'Arroz integral, frango grelhado e legumes', preco: 28.00, imagem: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80' },
    { id: 3, tipo: 'bebida', nome: 'Suco de Laranja 500ml', descricao: 'Feito na hora', preco: 9.00, imagem: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=80' },
    { id: 4, tipo: 'bebida', nome: 'Coca-Cola Lata', descricao: '350ml - Gelada', preco: 6.50, imagem: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=500&q=80' }
];

// Inicializa ou recupera os dados do navegador
let produtos = JSON.parse(localStorage.getItem('marmitaria_produtos')) || produtosIniciais;
let carrinho = JSON.parse(localStorage.getItem('marmitaria_carrinho')) || [];

// Salva o estado atual no navegador
function salvarDados() {
    localStorage.setItem('marmitaria_produtos', JSON.stringify(produtos));
    localStorage.setItem('marmitaria_carrinho', JSON.stringify(carrinho));
}

// ====== LÓGICA DO CLIENTE (index.html) ======

function carregarProdutos(filtro = 'todos') {
    const container = document.getElementById('menu-container');
    if (!container) return; // Se não estiver na index, não faz nada

    container.innerHTML = '';
    
    const produtosFiltrados = filtro === 'todos' 
        ? produtos 
        : produtos.filter(p => p.tipo === filtro);

    produtosFiltrados.forEach(produto => {
        container.innerHTML += `
            <div class="card">
                <img src="${produto.imagem}" alt="${produto.nome}">
                <div class="card-body">
                    <h3 class="card-title">${produto.nome}</h3>
                    <p class="card-desc">${produto.descricao}</p>
                    <div class="card-price">R$ ${produto.preco.toFixed(2).replace('.', ',')}</div>
                    <button class="btn-primary w-100" onclick="adicionarAoCarrinho(${produto.id})">
                        <i class="fa-solid fa-cart-plus"></i> Adicionar
                    </button>
                </div>
            </div>
        `;
    });
}

function filtrarMenu(tipo) {
    // Atualiza botões
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    // Recarrega lista
    carregarProdutos(tipo);
}

// Lógica do Carrinho
function toggleCart() {
    const sidebar = document.getElementById('cart-sidebar');
    sidebar.classList.toggle('open');
    renderizarCarrinho();
}

function adicionarAoCarrinho(id) {
    const produto = produtos.find(p => p.id === id);
    carrinho.push(produto);
    salvarDados();
    renderizarCarrinho();
    mostrarNotificacao(`✅ ${produto.nome} adicionado!`);
}

function removerDoCarrinho(index) {
    carrinho.splice(index, 1);
    salvarDados();
    renderizarCarrinho();
}

function renderizarCarrinho() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const cartCount = document.getElementById('cart-count');
    
    if(!cartItems) return;

    cartItems.innerHTML = '';
    let total = 0;

    if (carrinho.length === 0) {
        cartItems.innerHTML = '<p style="text-align:center; color:#6c757d; margin-top:20px;">Seu carrinho está vazio.</p>';
    } else {
        carrinho.forEach((item, index) => {
            total += item.preco;
            cartItems.innerHTML += `
                <div class="cart-item">
                    <div class="item-info">
                        <h4>${item.nome}</h4>
                        <p>R$ ${item.preco.toFixed(2).replace('.', ',')}</p>
                    </div>
                    <button class="remove-btn" onclick="removerDoCarrinho(${index})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `;
        });
    }

    cartTotal.innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
    cartCount.innerText = carrinho.length;
}
// Função para mostrar ou esconder o campo de troco
function verificarTroco() {
    const formaPagamento = document.getElementById('forma-pagamento').value;
    const divTroco = document.getElementById('div-troco');
    
    // Se escolheu dinheiro, mostra o campo. Se não, esconde.
    if (formaPagamento === 'Dinheiro') {
        divTroco.style.display = 'block';
    } else {
        divTroco.style.display = 'none';
        document.getElementById('troco').value = ''; // Limpa o valor do troco
    }
}

function enviarWhatsApp() {
    if (carrinho.length === 0) {
        alert("Seu carrinho está vazio!");
        return;
    }

    // 1. Captura as informações de pagamento
    const formaPagamento = document.getElementById('forma-pagamento').value;
    let infoPagamento = `\n*Forma de Pagamento:* ${formaPagamento}`;

    // Se for dinheiro, pega o valor do troco
    if (formaPagamento === 'Dinheiro') {
        const troco = document.getElementById('troco').value;
        if (troco) {
            infoPagamento += `\n*Troco para:* R$ ${parseFloat(troco).toFixed(2).replace('.', ',')}`;
        } else {
            infoPagamento += `\n*Troco:* Não precisa`;
        }
    }

    // 2. Monta o cabeçalho e os itens
    let texto = "*Novo Pedido - Sabor de Casa* 🍲\n\n";
    let total = 0;

    carrinho.forEach(item => {
        texto += `▪️ ${item.nome} - R$ ${item.preco.toFixed(2).replace('.', ',')}\n`;
        total += item.preco;
    });

    // 3. Monta o rodapé juntando o total e a forma de pagamento
    texto += `\n*Valor Total: R$ ${total.toFixed(2).replace('.', ',')}*`;
    texto += infoPagamento;

    // Coloque seu número aqui
    const telefone = "5544998733601"; 
    window.open(`https://wa.me/${telefone}?text=${encodeURIComponent(texto)}`, '_blank');
}

function mostrarNotificacao(mensagem) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = mensagem;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}


// ====== LÓGICA DO VENDEDOR (admin.html) ======

function carregarAdminList() {
    const lista = document.getElementById('admin-list');
    if (!lista) return;

    lista.innerHTML = '';
    produtos.forEach(produto => {
        lista.innerHTML += `
            <div class="admin-item">
                <div>
                    <strong>${produto.nome}</strong> (${produto.tipo})<br>
                    <small>R$ ${produto.preco.toFixed(2).replace('.', ',')}</small>
                </div>
                <div class="action-buttons">
                    <button class="btn-secondary" onclick="editarProdutoAdmin(${produto.id})">Editar</button>
                    <button class="btn-danger" onclick="removerProdutoAdmin(${produto.id})">Remover</button>
                </div>
            </div>
        `;
    });
}

const formAdmin = document.getElementById('form-add-item');
if (formAdmin) {
    formAdmin.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const editId = document.getElementById('edit-id').value;
        const inputImagem = document.getElementById('imagem');
        const arquivo = inputImagem.files[0];

        // Se for um produto NOVO e não tem foto, avisa o erro
        if (!arquivo && !editId) {
            alert("Por favor, selecione uma imagem para o novo produto!");
            return;
        }

        // Se ele enviou uma foto nova, nós lemos a foto
        if (arquivo) {
            const leitor = new FileReader();
            leitor.onload = function(evento) {
                salvarOuAtualizarProduto(editId, evento.target.result);
            };
            leitor.readAsDataURL(arquivo);
        } else {
            // Se ele não enviou foto nova, usamos a foto antiga que já estava salva
            const produtoExistente = produtos.find(p => p.id == editId);
            salvarOuAtualizarProduto(editId, produtoExistente.imagem);
        }
    });
}

function salvarOuAtualizarProduto(editId, imagemBase64) {
    if (editId) {
        // MODO ATUALIZAR
        const index = produtos.findIndex(p => p.id == editId);
        if(index !== -1){
            produtos[index].tipo = document.getElementById('tipo').value;
            produtos[index].nome = document.getElementById('nome').value;
            produtos[index].descricao = document.getElementById('descricao').value;
            produtos[index].preco = parseFloat(document.getElementById('preco').value);
            produtos[index].imagem = imagemBase64;
        }
        mostrarNotificacao("Produto atualizado com sucesso!");
    } else {
        // MODO ADICIONAR NOVO
        const novoProduto = {
            id: Date.now(),
            tipo: document.getElementById('tipo').value,
            nome: document.getElementById('nome').value,
            descricao: document.getElementById('descricao').value,
            preco: parseFloat(document.getElementById('preco').value),
            imagem: imagemBase64
        };
        produtos.push(novoProduto);
        mostrarNotificacao("Produto adicionado com sucesso!");
    }

    salvarDados();
    carregarAdminList();
    cancelarEdicao(); // Limpa o formulário e volta ao modo "Adicionar"
}

function editarProdutoAdmin(id) {
    const produto = produtos.find(p => p.id === id);
    if (!produto) return;

    // Preenche os campos do formulário
    document.getElementById('edit-id').value = produto.id;
    document.getElementById('tipo').value = produto.tipo;
    document.getElementById('nome').value = produto.nome;
    document.getElementById('descricao').value = produto.descricao;
    document.getElementById('preco').value = produto.preco;

    // Muda o visual do botão e mostra o botão de cancelar
    document.getElementById('btn-submit').innerHTML = '<i class="fa-solid fa-save"></i> Salvar Alterações';
    document.getElementById('btn-cancel').style.display = 'block';
    
    // Rola a página para cima
    window.scrollTo(0, 0);
}

function cancelarEdicao() {
    document.getElementById('edit-id').value = '';
    document.getElementById('form-add-item').reset();
    document.getElementById('btn-submit').innerHTML = '<i class="fa-solid fa-plus"></i> Salvar no Cardápio';
    document.getElementById('btn-cancel').style.display = 'none';
}

function removerProdutoAdmin(id) {
    produtos = produtos.filter(p => p.id !== id);
    salvarDados();
    carregarAdminList();
}

function limparCardapio() {
    if(confirm("Deseja apagar todos os itens e voltar ao cardápio padrão?")) {
        produtos = produtosIniciais;
        salvarDados();
        carregarAdminList();
    }
}

// Executar ao carregar a página
window.onload = () => {
    carregarProdutos();
    renderizarCarrinho();
    carregarAdminList();
};