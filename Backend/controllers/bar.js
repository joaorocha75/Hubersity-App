const ProdutosBar = require("../models/produtosBar.model").ProdutosBar;
const CategoriasBar = require("../models/categoriasBar.model").CategoriasBar;
const Carrinho = require("../models/carrinho.model").Carrinho;
const CarrinhoItens = require("../models/carrinhoItens.model").CarrinhoItens;
const PedidosBar = require("../models/pedidosBar.model").PedidosBar;
const Utilizadores = require("../models/utilizadores.model").Utilizadores;
const Pagamento = require("../models/pagamento.model").Pagamento;
const PedidosBarProdutos =
  require("../models/pedidosBarProdutos.model").PedidosBarProdutos;
const DetalhesPagamento =
  require("../models/detalhesPagamento.model").DetalhesPagamento;
const utilities = require("../utilities/utilities");
const QrCode = require("qrcode");

exports.adicionarProduto = async function (req, res) {
  try {
    let auth = utilities.verifyToken(req.headers.authorization);

    if (!auth ) {
      return res.status(401).send({
        message: "Token inválido.",
      });
    }

    if (auth.tipo !== "admin") {
      return res.status(401).send({
        message: "Não tem permissões de administrador.",
      });
    }

    // Verificar se o produto já existe
    const produto = await ProdutosBar.findOne({
      where: { Nome: req.body.Nome },
    });

    if (produto) {
      return res.status(400).send({
        message: "Produto já existe.",
      });
    }

    const categoria = await CategoriasBar.findOne({
      where: { Nome: req.body.Categoria },
    });

    if (!categoria) {
      return res.status(400).send({
        message: "Categoria não existe.",
      });
    }

    // Adicionar produto ao bar
    const novoproduto = await ProdutosBar.create({
      Nome: req.body.Nome,
      Descricao: req.body.Descricao,
      Preco: req.body.Preco,
      Stock: req.body.Stock,
      IdCategoria: categoria.idCategoriaBar,
    });

    return res.status(201).send({
      message: "Produto adicionado com sucesso.",
      produto: novoproduto,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      message: "Ocorreu um erro ao adicionar o produto.",
    });
  }
};

//obter produtos do bar
exports.obterProdutos = async function (req, res) {
  // Verificar autenticação
  let auth = utilities.verifyToken(req.headers.authorization);

  if (!auth) {
    return res.status(401).send({
      message: "Não autorizado.",
    });
  }

  try {
    // Buscar as categorias do bar
    const categorias = await CategoriasBar.findAll({
      attributes: ["idCategoriaBar", "nome"],
      raw: true,
    });

    // Buscar os produtos do bar agrupados por categoria
    const produtosPorCategoria = await Promise.all(
      categorias.map(async (categoria) => {
        const produtos = await ProdutosBar.findAll({
          where: { IdCategoria: categoria.idCategoriaBar },
          attributes: ["IdProduto", "Nome", "Descricao", "Preco", "Stock"],
          raw: true,
        });

        return {
          categoria: categoria,
          produtos: produtos,
        };
      })
    );
    const existeProdutos = produtosPorCategoria.some(
      (categoria) => categoria.produtos.length > 0
    );

    if (!existeProdutos) {
      return res.status(404).json({
        message: "Nenhum produto encontrado.",
      });
    }

    // Responder com os produtos agrupados por categoria
    return res.status(200).json(produtosPorCategoria);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Ocorreu um erro ao obter os produtos do bar.",
    });
  }
};

//adicionar produto ao carrinho
exports.adicionarProdutoCarrinho = async function (req, res) {
  // Verificar autenticação
  let auth = utilities.verifyToken(req.headers.authorization);

  if (!auth) {
    return res.status(401).send({
      message: "Não autorizado.",
    });
  }

  const userId = auth.id;
  const idProduto = parseInt(req.params.IdProduto);

  try {
    // Verificar se o produto existe
    const produto = await ProdutosBar.findOne({
      where: { IdProduto: idProduto },
      raw: true,
    });

    if (!produto) {
      return res.status(400).send({
        message: "Produto não existe.",
      });
    }

    // Verificar se o produto está em stock
    if (produto.Stock <= 0) {
      return res.status(400).send({
        message: "Produto fora de stock.",
      });
    }

    // Verificar se o produto já está no carrinho
    const produtoCarrinho = await CarrinhoItens.findOne({
      where: { IdProduto: idProduto, IdCarrinho: userId },
      raw: true,
    });

    // Se o produto já estiver no carrinho, incrementar a quantidade
    if (produtoCarrinho) {
      await CarrinhoItens.update(
        { Quantidade: produtoCarrinho.Quantidade + 1 },
        { where: { IdProduto: idProduto, IdCarrinho: userId } }
      );
    } else {
      // Criar carrinho se ainda não existir
      const carrinho = await Carrinho.findOne({
        where: { IdCarrinho: userId },
        raw: true,
      });

      if (!carrinho) {
        await Carrinho.create({
          IdCarrinho: userId,
        });
      }

      // Adicionar produto ao carrinho com quantidade inicial 1
      await CarrinhoItens.create({
        IdCarrinho: userId,
        IdProduto: idProduto,
        Quantidade: 1,
      });
    }

    return res.status(200).send({
      message: "Produto adicionado ao carrinho.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Ocorreu um erro ao adicionar o produto ao carrinho.",
    });
  }
};

//obter carrinho
exports.obterCarrinho = async function (req, res) {
  let auth = utilities.verifyToken(req.headers.authorization);

  if (!auth) {
    return res.status(401).send({
      message: "Não autorizado.",
    });
  }

  const userId = auth.id;
  try {
    const produtos = await CarrinhoItens.findAll({
      where: { IdCarrinho: userId },
      include: [
        {
          model: ProdutosBar,
          attributes: ["IdProduto", "Nome", "Descricao", "Preco", "Stock"],
          raw: true,
        },
      ],
      attributes: ["IdProduto", "Quantidade"],
      raw: true,
    });
    const existeProdutos = produtos.length > 0;
    if (!existeProdutos) {
      return res.status(404).json({
        message: "Nenhum produto encontrado.",
      });
    }
    return res.status(200).json(produtos);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Ocorreu um erro ao obter os produtos do carrinho.",
    });
  }
};

// apaagar produto do carrinho
exports.apagarProdutoCarrinho = async function (req, res) {
  let auth = utilities.verifyToken(req.headers.authorization);

  if (!auth) {
    return res.status(401).send({
      message: "Não autorizado.",
    });
  }

  const userId = auth.id;
  const idProduto = parseInt(req.params.IdProduto);

  try {
    const produto = await ProdutosBar.findOne({
      where: { IdProduto: idProduto },
      raw: true,
    });

    if (!produto) {
      return res.status(400).send({
        message: "Produto não existe.",
      });
    }

    const produtoCarrinho = await CarrinhoItens.findOne({
      where: { IdProduto: idProduto, IdCarrinho: userId },
      raw: true,
    });

    if (!produtoCarrinho) {
      return res.status(400).send({
        message: "Produto não está no carrinho no carrinho.",
      });
    }

    await CarrinhoItens.destroy({
      where: { IdProduto: idProduto, IdCarrinho: userId },
    });

    return res.status(200).send({
      message: "Produto removido do carrinho.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Ocorreu um erro ao remover o produto do carrinho.",
    });
  }
};

//Pagar carrinho
exports.pagarCarrinho = async function (req, res) {
  try {
    let auth = utilities.verifyToken(req.headers.authorization);

    if (!auth || auth.id != req.params.id) {
      return res.status(401).send({
        message: "Não autorizado.",
      });
    }

    const userId = parseInt(req.params.id);

    const utilizador = await Utilizadores.findOne({
      where: {
        UserId: userId,
      },
    });

    if (!utilizador) {
      return res.status(404).send({
        message: "Utilizador não existe.",
      });
    }

    const carrinho = await Carrinho.findOne({
      where: {
        IdCarrinho: userId,
      },
    });

    if (!carrinho) {
      return res.status(404).send({
        message: "Carrinho não existe.",
      });
    }

    const produtosCarrinho = await CarrinhoItens.findAll({
      where: {
        IdCarrinho: userId,
      },
      include: [{ model: ProdutosBar }],
    });

    if (produtosCarrinho.length === 0) {
      return res.status(400).send({
        message: "Carrinho vazio.",
      });
    }

    const total = produtosCarrinho.reduce((total, produto) => {
      const preco = produto.ProdutosBar.Preco;
      const quantidade = produto.Quantidade;
      return total + preco * quantidade;
    }, 0);

    const detalhesPagamentoExistente = await DetalhesPagamento.findOne({
      where: {
        UserId: userId,
      },
    });

    let detalhesPagamento;

    if (!detalhesPagamentoExistente) {
      detalhesPagamento = await DetalhesPagamento.create({
        UserId: userId,
        NumeroCartao: req.body.NumeroCartao,
        CVV: req.body.CVV,
        DataValidade: req.body.DataValidade,
        NomeTitular: req.body.NomeTitular,
      });
    } else {
      detalhesPagamento = detalhesPagamentoExistente;
    }

    if (!detalhesPagamento) {
      return res.status(400).send({
        message: "Detalhes de pagamento inválidos.",
      });
    }

    const dataAtual = new Date();
    const ano = dataAtual.getFullYear();
    const mes = (dataAtual.getMonth() + 1).toString().padStart(2, "0");
    const dia = dataAtual.getDate().toString().padStart(2, "0");

    const dataFormatada = `${ano}/${mes}/${dia}`;

    // criar pagamento
    const pagamento = await Pagamento.create({
      UserId: userId,
      Valor: total,
      Data: dataFormatada,
      IdDetalhesPagamento: detalhesPagamento.IdDetalhesPagamento,
    });

    // criar pedido
    const novoPedido = await PedidosBar.create({
      UserId: userId,
      Data: dataFormatada,
      Status: "pendente",
      IdPagamento: pagamento.IdPagamento,
      QRCode: "teste",
    });

    await Promise.all(
      produtosCarrinho.map(async (produtoCarrinho) => {
        await PedidosBarProdutos.create({
          IdPedido: novoPedido.IdPedido,
          IdProduto: produtoCarrinho.IdProduto,
          Quantidade: produtoCarrinho.Quantidade,
        });
        await ProdutosBar.decrement(
          { Stock: produtoCarrinho.Quantidade },
          { where: { IdProduto: produtoCarrinho.IdProduto } }
        );
        await CarrinhoItens.destroy({
          where: { IdProduto: produtoCarrinho.IdProduto, IdCarrinho: userId },
        });
      })
    );
    const produtosPedido = await PedidosBarProdutos.findAll({
      where: {
        IdPedido: novoPedido.IdPedido,
      },
    });

    const qrData = {
      utilizador: utilizador.nome,
      numeroPedido: novoPedido.IdPedido,
      produtos: produtosPedido,
    };

    utilities.generateQrToken(qrData, async (token) => {
      qrData.token = token;

      const qrCode = await QrCode.toDataURL(JSON.stringify(qrData));

      await PedidosBar.update(
        { QRCode: qrCode },
        { where: { IdPedido: novoPedido.IdPedido } }
      );
    });

    return res.status(200).send({
      message: "Pagamento e pedido processados com sucesso.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      message: error.message || "Erro interno do servidor.",
    });
  }
};

//ver pedido individual
exports.verPedidoIndividual = async function (req, res) {
  try {
    let auth = utilities.verifyToken(req.headers.authorization);

    if (!auth) {
      return res.status(401).send({
        message: "Token inválido.",
      });
    }

    const userId = auth.id;

    const pedido = await PedidosBar.findOne({
      where: {
        IdPedido: req.params.IdPedido,
        UserId: userId,
      },
      attributes: ["IdPedido", "UserId", "QRCode"],
      include: [
        {
          model: PedidosBarProdutos,
          attributes: ["IdProduto", "Quantidade"],
          include: [
            {
              model: ProdutosBar,
              attributes: ["IdProduto", "Nome", "Descricao", "Preco", "Stock"],
              raw: true,
            },
          ],
          raw: true,
        },
      ],
      raw: true,
    });

    if (!pedido) {
      return res.status(404).send({
        message: "Pedido não existe.",
      });
    }

    return res.status(200).send(pedido);
  } catch (error) {
    return res.status(500).send({
      message: "Ocorreu um erro ao obter o pedido.",
    });
  }
};

//ver pedidos por levantar
exports.verPedidosPorLevantar = async function (req, res) {
  try {
    let auth = utilities.verifyToken(req.headers.authorization);

    if (!auth) {
      return res.status(401).send({
        message: "Token de autenticação inválido",
      });
    }

    const userId = parseInt(auth.id);

    const pedidosPorLevantar = await PedidosBar.findAll({
      where: {
        UserId: userId,
        Status: "pendente",
      },
      attributes: ["IdPedido", "Data", "Status", "QRCode"],
      raw: true,
      
    });

    if (pedidosPorLevantar.length === 0) {
      return res.status(204).send({
        message: "Nenhum pedido por levantar",
      });
    }

    return res.status(200).send({
      mensgaem: "Pedidos por levantar encontrados",
      pedidos: pedidosPorLevantar,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      message: "Algo correu mal, tente novamente mais tarde",
    });
  }
};

//obter todos os pedidos do bar, histórico
exports.obterPedidosBarHistorico = async function (req, res) {
  try {
    let auth = utilities.verifyToken(req.headers.auth_key);

    if (!auth) {
      return res.status(401).send({
        message: "Token de autenticação inválido",
      });
    }

    const userId = auth.id;

    const pedidos = await PedidosBar.findAll({
      where: {
        UserId: userId,
      },
      attributes: ["IdPedido", "Data", "Status"],
      include: [
        {
          model: PedidosBarProdutos,
          attributes: ["IdProduto", "Quantidade"],
          include: [
            {
              model: ProdutosBar,
              attributes: ["IdProduto", "Nome", "Descricao", "Preco", "Stock"],
              raw: true,
            },
          ],
          raw: true,
        },
      ],
    });

    if (pedidos.length === 0) {
      return res.status(204).send({
        message: "Nenhum pedido encontrado",
      });
    }

    return res.status(200).send(pedidos);
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      message: "Algo correu mal, tente novamente mais tarde",
    });
  }
};

//alterar quantidade do produto no carrinho
exports.alterarQuantidadeProdutoCarrinho = async function (req, res) {
  try {
    let auth = utilities.verifyToken(req.headers.authorization);

    if (!auth) {
      return res.status(401).send({
        message: "Token inválido.",
      });
    }

    const userId = auth.id;
    const idProduto = parseInt(req.params.IdProduto);
    const operacao = req.query.operacao;

    const quantidade =
      operacao === "aumentar" ? 1 : operacao === "diminuir" ? -1 : 0;

    if (quantidade === 0) {
      return res.status(400).send({
        message: "Operação inválida.",
      });
    }

    const produto = await ProdutosBar.findOne({
      where: { IdProduto: idProduto },
      raw: true,
    });

    if (!produto) {
      return res.status(400).send({
        message: "Produto não existe.",
      });
    }

    const produtoCarrinho = await CarrinhoItens.findOne({
      where: { IdProduto: idProduto, IdCarrinho: userId },
      raw: true,
    });

    if (!produtoCarrinho) {
      return res.status(400).send({
        message: "Produto não está no carrinho.",
      });
    }

    if (
      quantidade > 0 &&
      quantidade + produtoCarrinho.Quantidade > produto.Stock
    ) {
      return res.status(400).send({
        message: "Quantidade superior ao stock.",
      });
    }

    const novaQuantidade = produtoCarrinho.Quantidade + quantidade;

    if (novaQuantidade <= 0) {
      await CarrinhoItens.destroy({
        where: { IdProduto: idProduto, IdCarrinho: userId },
      });
      return res.status(200).send({
        message: "Produto removido do carrinho.",
      });
    }

    await CarrinhoItens.update(
      { Quantidade: novaQuantidade },
      { where: { IdProduto: idProduto, IdCarrinho: userId } }
    );

    return res.status(200).send({
      message: "Quantidade alterada com sucesso.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Ocorreu um erro ao alterar a quantidade do produto.",
    });
  }
};
