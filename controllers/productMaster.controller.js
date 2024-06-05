const productMaster = require("../models/productMaster");
const productCategory = require("../models/productCategory");
const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const { Op } = require("sequelize");
const { generateExcel } = require("../utils/exportData");

const readXlsxFile = require("read-excel-file/node");

const fs = require("fs");
const ParentSubCategory = require("../models/parentSubCategory");

exports.addProduct = async (req, res, next) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ status: 400, message: "Please upload a file!" });
    }

    const {
      model,
      productName,
      productCode,
      description,
      price,
      productCategoryID,
      parentSubCategoryID,
    } = req.body;

    const image = req.file.filename;

    const existingProduct = await productMaster.findOne({
      where: {
        [Op.or]: [{ productName }, { productCode }],
      },
    });

    if (existingProduct) {
      const message =
        existingProduct.productName === productName
          ? "Product name already exists."
          : "Product Code already exists.";
      return res.status(200).json({ status: 409, message });
    }

    const newProduct = await productMaster.create({
      model,
      productName,
      productCode,
      description,
      price,
      image,
      productCategoryID,
      parentSubCategoryID,
    });

    res.status(200).json({
      status: 200,
      message: "Product added successfully",
      data: newProduct,
    });
  } catch (error) {
    res.status(500).json({ status: 500, error: error.message });
    next(error);
  }
};

exports.editProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      productCategoryID,
      parentSubCategoryID,
      productName,
      productCode,
      description,
      price,
      image,
      updateBy,
      updateByIp,
    } = req.body;

    // const existingProduct = await productMaster.findOne({
    //   where: {
    //     [Op.or]: [{ productName }, { productCode }],
    //   },
    // });

    // if (existingProduct) {
    //   const message =
    //     existingProduct.productName === productName
    //       ? "Product name already exists."
    //       : "Product Code already exists.";
    //   return res.status(200).json({ status: 409, message });
    // }

    await productMaster.update(
      {
        productCategoryID,
        parentSubCategoryID,
        productName,
        productCode,
        description,
        price,
        image,
        updateBy,
        updateByIp,
      },
      { where: { productMasterID: id } }
    );

    res
      .status(200)
      .json({ status: 200, message: "Product updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if the product exists
    const existingProduct = await productMaster.findByPk(id);

    // If the product exists, delete it
    await productMaster.update(
      { status: "2" },
      { where: { productMasterID: id } }
    );
    res.status(200).json({
      status: 200,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ status: 500, error: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productMaster.findByPk(id, {
      include: [
        {
          model: productCategory,
          attributes: ["categoryName"],
        },
        {
          model: ParentSubCategory,
          attributes: ["parentSubCategoryName"],
        },
      ],
    });

    res.status(200).json({
      status: 200,
      data: product,
      message: "product data fetch successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const products = await productMaster.findAll({
      where: {
        productCategoryID: categoryId,
        status: "1",
      },
    });

    res.status(200).json({
      status: 200,
      message: "products get succesfully",
      data: products,
    });
  } catch (error) {
    res.status(500).json({ status: 500, error: error.message });
  }
};

exports.getProductsByParentCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const products = await productMaster.findAll({
      where: {
        parentSubCategoryID: id,
        status: "1",
      },
    });

    res.status(200).json({
      status: 200,
      message: "products get succesfully",
      data: products,
    });
  } catch (error) {
    res.status(500).json({ status: 500, error: error.message });
  }
};

exports.getAllProducts = async (req, res, next) => {
  try {
    const {
      page ,
      limit,
      searchQuery,
      sortBy,
      exportData,
      productCategoryID,
      parentSubCategoryID,
    } = req.body;


    const condition = {};
    if (searchQuery) {
      condition[Sequelize.Op.or] = [
        { productName: { [Sequelize.Op.iLike]: "%" + searchQuery + "%" } },
        { productCode: { [Sequelize.Op.iLike]: "%" + searchQuery + "%" } },
      ];
    }

    condition.status = [0, 1];

    if (productCategoryID) condition.productCategoryID = productCategoryID;

    if (parentSubCategoryID) condition.parentSubCategoryID = parentSubCategoryID;

    const order = [];
    
    if (sortBy === "newest") {
      order.push(["createdAt", "DESC"]);
    } else if (sortBy === "oldest") {
      order.push(["createdAt", "ASC"]);
    } else if (sortBy === "lowPrice") {
      order.push(["price", "ASC"]);
    } else if (sortBy === "highPrice") {
      order.push(["price", "DESC"]);
    } else {
      order.push(["productMasterID", "ASC"]);
    }

    const paginationQuery = {
      offset: (page - 1) * limit,
      limit: parseInt(limit),
    };

    const getalldata = await productMaster.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      order,
      include: [
        {
          model: productCategory,
          attributes: ["categoryName"],
        },
        {
          model: ParentSubCategory,
          attributes: ["parentSubCategoryName"],
        },
      ],
    });

    if (exportData) {
      const finaldata = getalldata.rows.map(rowData => ({
        categoryName: rowData["productCategory.categoryName"],
        parentSubCategoryName: rowData["parentSubCategory.parentSubCategoryName"],
        productID: rowData.productMasterID,
        productName: rowData.productName,
        model: rowData.model,
        productCode: rowData.productCode,
        Description: rowData.description,
        price: rowData.price,
        image: rowData.image,
      }));

      await generateExcel(finaldata, "Product Master", "xlsx", res);
      return;
    }

    return res.status(200).json({
      message: "Product data fetched Successfully",
      status: 200,
      data: getalldata.rows,
      totalcount: getalldata.count,
      pageSize: paginationQuery.limit,
    });
  } catch (err) {
    next(err);
  }
};

exports.poststatuschange = async (req, res, next) => {
  try {
    let { productMasterID, status } = await req.body;
    let change_status;

    let result = await sequelize.transaction(async (t) => {
      if (status == "1") {
        change_status = await productMaster.update(
          {
            status: "1",
          },
          {
            where: { productMasterID: productMasterID, status: ["1", "0"] },
            transaction: t,
          }
        );
      } else {
        change_status = await productMaster.update(
          {
            status: "0",
          },
          {
            where: { productMasterID: productMasterID, status: ["1", "0"] },
            transaction: t,
          }
        );
      }
    });

    const message =
      status == 1
        ? "Product is activated successfully."
        : "Product is deativated successfully.";

    return res.status(200).json({
      status: 200,
      message: message,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 200;
    }
    next(err);
  }
};

exports.uploadProduct = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).send("Please upload an excel file!");

    let path = "./uploads/" + req.file.filename;
    const rows = await readXlsxFile(path);
    rows.shift();
    const productData = [];

    for (let row of rows) {
      const product = {
        model: row[0],
        productName: row[1],
        productCode: row[2],
        description: row[3],
        price: row[4],
        image: row[5],
        productCategoryID: req.body.productCategoryID,
        parentSubCategoryID: req.body.parentSubCategoryID,
        createBy: req.body.createBy,
        createByIp: req.body.createByIp,
      };
      productData.push(product);
    }

    await sequelize.transaction(async (t) => {
      await productMaster.bulkCreate(productData, { transaction: t });
      fs.unlink(path, (err) => {
        if (err) {
          console.error(`Error deleting file: ${err.message}`);
        } else {
          console.error("File deleted successfully", path);
        }
      });

      return res.status(200).send({
        status: 200,
        message: "File uploaded successfully " + req.file.originalname,
      });
    });
  } catch (error) {
    next(error);
  }
};
