const produtosIniciais = [
    { id: 1, tipo: 'prato', nome: 'Marmita Tradicional', descricao: 'Arroz, feijão, bife acebolado e fritas', precoP: 20.00, precoM: 25.90, precoG: 30.00, imagem: 'https://images.unsplash.com/photo-1628294895950-9805252327bc?auto=format&fit=crop&w=500&q=80' },
    { id: 2, tipo: 'prato', nome: 'Marmita Fit', descricao: 'Arroz integral, frango grelhado e legumes', precoP: 22.00, precoM: 28.00, precoG: 33.00, imagem: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80' },
    { id: 3, tipo: 'bebida', nome: 'Suco de Laranja 500ml', descricao: 'Feito na hora', preco: 9.00, imagem: 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
    { id: 4, tipo: 'bebida', nome: 'Coca-Cola Lata', descricao: '350ml - Gelada', preco: 6.50, imagem: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=500&q=80' }
];

let produtos = [];
let carrinho = [];
let db = null;

const NOVA_IMAGEM_SUCO_LARANJA = 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
const ANTIGA_IMAGEM_SUCO_LARANJA = 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=80';

function atualizarImagemSucoLaranja() {
    const suco = produtos.find(p => p.id === 3);
    if (!suco) return;

    if (suco.imagem === ANTIGA_IMAGEM_SUCO_LARANJA) {
        suco.imagem = NOVA_IMAGEM_SUCO_LARANJA;
        salvarDados();
    }
}

function inicializarBD() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('MarmitariaDB', 1);
        
        request.onerror = () => {
            carregarDoLocalStorage();
            resolve();
        };
        
        request.onsuccess = (event) => {
            db = event.target.result;
            criarTabelas();
            carregarDadosBD();
            resolve();
        };
        
        request.onupgradeneeded = (event) => {
            const database = event.target.result;
            if (!database.objectStoreNames.contains('produtos')) {
                database.createObjectStore('produtos', { keyPath: 'id' });
            }
            if (!database.objectStoreNames.contains('carrinho')) {
                database.createObjectStore('carrinho', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

function criarTabelas() {
    if (!db) return;
    const transaction = db.transaction(['produtos', 'carrinho'], 'readwrite');
}

function carregarDadosBD() {
    if (!db) {
        carregarDoLocalStorage();
        return;
    }
    
    const transaction = db.transaction(['produtos', 'carrinho'], 'readonly');
    
    const produtosRequest = transaction.objectStore('produtos').getAll();
    produtosRequest.onsuccess = () => {
        const dados = produtosRequest.result;
        if (dados.length > 0) {
            produtos = dados;
        } else {
            produtos = produtosIniciais;
            salvarDados();
        }
        atualizarImagemSucoLaranja();
        carregarProdutos();
        carregarAdminList();
    };
    
    const carrinhoRequest = transaction.objectStore('carrinho').getAll();
    carrinhoRequest.onsuccess = () => {
        carrinho = carrinhoRequest.result;
        renderizarCarrinho();
    };
}

function carregarDoLocalStorage() {
    produtos = JSON.parse(localStorage.getItem('marmitaria_produtos')) || produtosIniciais;
    carrinho = JSON.parse(localStorage.getItem('marmitaria_carrinho')) || [];
    atualizarImagemSucoLaranja();
    salvarDados();
}

function salvarDados() {
    localStorage.setItem('marmitaria_produtos', JSON.stringify(produtos));
    localStorage.setItem('marmitaria_carrinho', JSON.stringify(carrinho));
    
    if (!db) return;
    
    const transaction = db.transaction(['produtos', 'carrinho'], 'readwrite');
    const produtosStore = transaction.objectStore('produtos');
    const carrinhoStore = transaction.objectStore('carrinho');
    
    produtosStore.clear();
    produtos.forEach(produto => { produtosStore.add(produto); });
    
    carrinhoStore.clear();
    carrinho.forEach(item => { carrinhoStore.add(item); });
}

function atualizarPrecoExibido(id, tamanhoSelecionado) {
    const produto = produtos.find(p => p.id === id);
    let precoAtual = 0;
    
    if (tamanhoSelecionado === 'P') precoAtual = produto.precoP;
    if (tamanhoSelecionado === 'M') precoAtual = produto.precoM;
    if (tamanhoSelecionado === 'G') precoAtual = produto.precoG;
    
    document.getElementById(`preco-display-${id}`).innerText = `R$ ${precoAtual.toFixed(2).replace('.', ',')}`;
}

function carregarProdutos(filtro = 'todos') {
    const container = document.getElementById('menu-container');
    if (!container) return; 

    container.innerHTML = '';
    
    const produtosFiltrados = filtro === 'todos' 
        ? produtos 
        : produtos.filter(p => p.tipo === filtro);

    produtosFiltrados.forEach(produto => {
        let seletorTamanho = '';
        let precoExibido = 0;

        if (produto.tipo === 'prato') {
            precoExibido = produto.precoM || 0;
            seletorTamanho = `
                <div style="margin-bottom: 15px; margin-top: auto;">
                    <label for="tamanho-${produto.id}" style="font-size: 0.9rem; color: #6c757d; font-weight: bold;">Tamanho da Marmita:</label>
                    <select id="tamanho-${produto.id}" class="select-tamanho" onchange="atualizarPrecoExibido(${produto.id}, this.value)">
                        <option value="P">Pequena (P) - R$ ${(produto.precoP || 0).toFixed(2).replace('.', ',')}</option>
                        <option value="M" selected>Média (M) - R$ ${(produto.precoM || 0).toFixed(2).replace('.', ',')}</option>
                        <option value="G">Grande (G) - R$ ${(produto.precoG || 0).toFixed(2).replace('.', ',')}</option>
                    </select>
                </div>
            `;
        } else {
            precoExibido = produto.preco || 0;
        }

        container.innerHTML += `
            <div class="card">
                <img src="${produto.imagem}" alt="${produto.nome}">
                <div class="card-body">
                    <h3 class="card-title">${produto.nome}</h3>
                    <p class="card-desc">${produto.descricao}</p>
                    ${seletorTamanho}
                    <div class="card-price" id="preco-display-${produto.id}">R$ ${precoExibido.toFixed(2).replace('.', ',')}</div>
                    <button class="btn-primary w-100" onclick="adicionarAoCarrinho(${produto.id})">
                        <i class="fa-solid fa-cart-plus"></i> Adicionar
                    </button>
                </div>
            </div>
        `;
    });
}

function filtrarMenu(tipo) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    carregarProdutos(tipo);
}

function toggleCart() {
    const sidebar = document.getElementById('cart-sidebar');
    sidebar.classList.toggle('open');
    renderizarCarrinho();
}

function adicionarAoCarrinho(id) {
    const produtoOriginal = produtos.find(p => p.id === id);
    const itemCarrinho = { ...produtoOriginal };

    if (itemCarrinho.tipo === 'prato') {
        const tamanhoSelecionado = document.getElementById(`tamanho-${id}`).value;
        itemCarrinho.nome = `${itemCarrinho.nome} (Tam: ${tamanhoSelecionado})`;
        
        if (tamanhoSelecionado === 'P') itemCarrinho.preco = itemCarrinho.precoP;
        else if (tamanhoSelecionado === 'M') itemCarrinho.preco = itemCarrinho.precoM;
        else if (tamanhoSelecionado === 'G') itemCarrinho.preco = itemCarrinho.precoG;
    }

    carrinho.push(itemCarrinho);
    salvarDados();
    renderizarCarrinho();
    mostrarNotificacao(`✅ Adicionado ao carrinho!`);
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

function verificarTroco() {
    const formaPagamento = document.getElementById('forma-pagamento').value;
    const divTroco = document.getElementById('div-troco');
    
    if (formaPagamento === 'Dinheiro') {
        divTroco.style.display = 'block';
    } else {
        divTroco.style.display = 'none';
        document.getElementById('troco').value = ''; 
    }
}

function enviarWhatsApp() {
    if (carrinho.length === 0) {
        alert("Seu carrinho está vazio!");
        return;
    }

    const formaPagamento = document.getElementById('forma-pagamento').value;
    let infoPagamento = `\n*Forma de Pagamento:* ${formaPagamento}`;

    if (formaPagamento === 'Dinheiro') {
        const troco = document.getElementById('troco').value;
        if (troco) {
            infoPagamento += `\n*Troco para:* R$ ${parseFloat(troco).toFixed(2).replace('.', ',')}`;
        } else {
            infoPagamento += `\n*Troco:* Não precisa`;
        }
    }

    let texto = "*Novo Pedido - Sabor de Casa* 🍲\n\n";
    let total = 0;

    carrinho.forEach(item => {
        texto += `▪️ ${item.nome} - R$ ${item.preco.toFixed(2).replace('.', ',')}\n`;
        total += item.preco;
    });

    texto += `\n*Valor Total: R$ ${total.toFixed(2).replace('.', ',')}*`;
    texto += infoPagamento;

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

function realizarLogin() {
    const u = document.getElementById('login-user').value;
    const p = document.getElementById('login-pass').value;

    if (u === 'admin' && p === '1234') {
        sessionStorage.setItem('adminAutenticado', 'true');
        liberarAdmin();
    } else {
        document.getElementById('login-erro').style.display = 'block';
    }
}

function fazerLogout() {
    sessionStorage.removeItem('adminAutenticado');
    window.location.reload();
}

function liberarAdmin() {
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('admin-content').style.display = 'block';
}

function checarSessao() {
    const overlay = document.getElementById('login-overlay');
    if (!overlay) return; 

    if (sessionStorage.getItem('adminAutenticado') === 'true') {
        liberarAdmin();
    }
}

function alternarCamposPreco() {
    const tipo = document.getElementById('tipo').value;
    if (tipo === 'prato') {
        document.getElementById('div-precos-marmita').style.display = 'flex';
        document.getElementById('div-preco-unico').style.display = 'none';
    } else {
        document.getElementById('div-precos-marmita').style.display = 'none';
        document.getElementById('div-preco-unico').style.display = 'block';
    }
}

function carregarAdminList() {
    const lista = document.getElementById('admin-list');
    if (!lista) return;

    lista.innerHTML = '';
    produtos.forEach(produto => {
        let infoPreco = '';
        if (produto.tipo === 'prato') {
            infoPreco = `P: R$ ${(produto.precoP || 0).toFixed(2)} | M: R$ ${(produto.precoM || 0).toFixed(2)} | G: R$ ${(produto.precoG || 0).toFixed(2)}`;
        } else {
            infoPreco = `R$ ${(produto.preco || 0).toFixed(2).replace('.', ',')}`;
        }

        lista.innerHTML += `
            <div class="admin-item">
                <div>
                    <strong>${produto.nome}</strong> (${produto.tipo})<br>
                    <small style="color: #2a9d8f; font-weight: bold;">${infoPreco}</small>
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

        if (!arquivo && !editId) {
            alert("Por favor, selecione uma imagem para o novo produto!");
            return;
        }

        if (arquivo) {
            const leitor = new FileReader();
            leitor.onload = function(evento) {
                salvarOuAtualizarProduto(editId, evento.target.result);
            };
            leitor.readAsDataURL(arquivo);
        } else {
            const produtoExistente = produtos.find(p => p.id == editId);
            salvarOuAtualizarProduto(editId, produtoExistente.imagem);
        }
    });
}

function salvarOuAtualizarProduto(editId, imagemBase64) {
    const tipoProd = document.getElementById('tipo').value;
    
    let precoP = 0, precoM = 0, precoG = 0, precoUnico = 0;
    
    if (tipoProd === 'prato') {
        precoP = parseFloat(document.getElementById('preco-p').value) || 0;
        precoM = parseFloat(document.getElementById('preco-m').value) || 0;
        precoG = parseFloat(document.getElementById('preco-g').value) || 0;
    } else {
        precoUnico = parseFloat(document.getElementById('preco').value) || 0;
    }

    if (editId) {
        const index = produtos.findIndex(p => p.id == editId);
        if(index !== -1){
            produtos[index].tipo = tipoProd;
            produtos[index].nome = document.getElementById('nome').value;
            produtos[index].descricao = document.getElementById('descricao').value;
            produtos[index].imagem = imagemBase64;
            
            if(tipoProd === 'prato') {
                produtos[index].precoP = precoP;
                produtos[index].precoM = precoM;
                produtos[index].precoG = precoG;
                delete produtos[index].preco; 
            } else {
                produtos[index].preco = precoUnico;
            }
        }
        mostrarNotificacao("Produto atualizado com sucesso!");
    } else {
        const novoProduto = {
            id: Date.now(),
            tipo: tipoProd,
            nome: document.getElementById('nome').value,
            descricao: document.getElementById('descricao').value,
            imagem: imagemBase64
        };
        
        if(tipoProd === 'prato') {
            novoProduto.precoP = precoP; 
            novoProduto.precoM = precoM; 
            novoProduto.precoG = precoG;
        } else {
            novoProduto.preco = precoUnico;
        }
        
        produtos.push(novoProduto);
        mostrarNotificacao("Produto adicionado com sucesso!");
    }

    salvarDados();
    carregarAdminList();
    cancelarEdicao(); 
}

function editarProdutoAdmin(id) {
    const produto = produtos.find(p => p.id === id);
    if (!produto) return;

    document.getElementById('edit-id').value = produto.id;
    document.getElementById('tipo').value = produto.tipo;
    alternarCamposPreco();

    document.getElementById('nome').value = produto.nome;
    document.getElementById('descricao').value = produto.descricao;
    
    if (produto.tipo === 'prato') {
        document.getElementById('preco-p').value = produto.precoP;
        document.getElementById('preco-m').value = produto.precoM;
        document.getElementById('preco-g').value = produto.precoG;
    } else {
        document.getElementById('preco').value = produto.preco;
    }

    document.getElementById('btn-submit').innerHTML = '<i class="fa-solid fa-save"></i> Salvar Alterações';
    document.getElementById('btn-cancel').style.display = 'block';
    
    window.scrollTo(0, 0);
}

function cancelarEdicao() {
    document.getElementById('edit-id').value = '';
    document.getElementById('form-add-item').reset();
    document.getElementById('btn-submit').innerHTML = '<i class="fa-solid fa-plus"></i> Salvar no Cardápio';
    document.getElementById('btn-cancel').style.display = 'none';
    alternarCamposPreco();
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

window.onload = () => {
    inicializarBD().then(() => {
        carregarProdutos();
        renderizarCarrinho();
        checarSessao();
        if(document.getElementById('admin-list')) {
            alternarCamposPreco();
            carregarAdminList();
        }
    });
};
