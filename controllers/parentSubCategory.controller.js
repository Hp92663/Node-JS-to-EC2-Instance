const ParentSubCategory = require("../models/parentSubCategory");
const ChildParentCategory = require("../models/childParentCategory");
const ProductCategory = require("../models/productCategory");
const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const { generateExcel } = require("../utils/exportData");
const readXlsxFile = require("read-excel-file/node");
const fs = require("fs");
const productMaster = require("../models/productMaster");

exports.addParentCategory = async (req, res, next) => {
  try {
    const {
      parentSubCategoryName,
      description,
      productCategoryID,
      createBy,
      createByIp,
    } = req.body;

    const existingProduct = await ParentSubCategory.findOne({
      where: {
        [Op.or]: [{ parentSubCategoryName }],
      },
    });

    if (existingProduct) {
      const message =
        existingProduct.parentSubCategoryName === parentSubCategoryName;
      return res.status(200).json({
        status: 403,
        message: "parentSubCategoryName already exists with same name",
      });
    }

    const newCategory = await ParentSubCategory.create({
      parentSubCategoryName,
      description,
      productCategoryID,
      createBy,
      createByIp,
    });

    res.status(200).json({
      status: 200,
      message: "Product parent sub-category added successfully",
      data: newCategory,
    });
  } catch (error) {
    res.status(500).json({ status: 500, error: error.message });
    next(error);
  }
};

exports.editParentCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      parentSubCategoryName,
      description,
      productCategoryID,
      updateBy,
      updateByIp,
    } = req.body;

    const existingProduct = await ParentSubCategory.findOne({
      where: {
        [Op.or]: [{ parentSubCategoryName }],
      },
    });

    if (existingProduct) {
      const message =
        existingProduct.parentSubCategoryName === parentSubCategoryName;
      return res.status(200).json({
        status: 403,
        message: "parentSubCategoryName already exists with same name",
      });
    }

    await ParentSubCategory.update(
      {
        productCategoryID,
        parentSubCategoryName,
        description,
        updateBy,
        updateByIp,
      },
      { where: { parentSubCategoryID: id } }
    );

    res.status(200).json({
      status: 200,
      message: "Parent Sub Category updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      error: error.message,
    });
  }
};

//   delete
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const childCategoryCount = await ChildParentCategory.count({
      where: { parentSubCategoryID: id },
    });
    if (childCategoryCount > 0) {
      return res.status(200).json({
        status: 500,
        message:
          "Can't delete Parent Sub-Category it is associated with Child Category",
      });
    }
    const productcount = await productMaster.count({
      where: { parentSubCategoryID: id },
    });
    if (productcount > 0) {
      return res.status(200).json({
        status: 500,
        message:
          "Can't delete Parent Sub-Category it is associated with Product",
      });
    }
    await ParentSubCategory.update(
      { status: "2" },
      { where: { parentSubCategoryID: id } }
    );
    res.status(200).json({
      status: 200,
      message: "Parent Sub Category deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      error: error.message,
    });
  }
};

// all category
exports.getAllParentCategory = async (req, res, next) => {
  const { page, limit, searchQuery, exportData } = req.body;

  try {
    const condition = {};
    if (searchQuery) {
      condition[Sequelize.Op.or] = [
        { parentSubCategoryName: { [Sequelize.Op.iLike]: "%" + searchQuery + "%" } },
      ];
    }

    condition.status = [0, 1];
    const order = [["parentSubCategoryID", "ASC"]];
    const paginationQuery = {};

    if (!exportData) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const categories = await ParentSubCategory.findAndCountAll({
      raw: true,
      where: condition,
      order,
      ...paginationQuery,
      include: [
        {
          model: ProductCategory,
          attributes: ["categoryName"],
        },
      ],
    });
    if (exportData) {
      const finaldata = [];

      for (let i = 0; i < categories.rows.length; i++) {
        const rowData = categories.rows[i]; // Fetch the row directly

        const object = {
          categoryName: rowData["productCategory.categoryName"],
          productCategoryID: rowData.productCategoryID,
          parentSubCategoryName: rowData.parentSubCategoryName,
          Description: rowData.description,
        };
        finaldata.push(object);
      }

      await generateExcel(finaldata, "Parent Sub-Category", "xlsx", res);
      return;
    }

    res.status(200).json({
      message: "Parent Sub-Category fetched successfully",
      status: 200,
      data: categories.rows,
      totalcount: categories.count,
      page: +page,
      pageSize: paginationQuery.limit,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
    next(error);
  }
};

exports.getParentCategoryById = async (req, res, next) => {
  const { parentSubCategoryID } = req.params;

  try {
    const parentCategory = await ParentSubCategory.findByPk(
      parentSubCategoryID,
      {
        include: [
          {
            model: ProductCategory,
            attributes: ["categoryName"],
          },
        ],
      }
    );
    if (!parentCategory) {
      return res
        .status(200)
        .json({ status: 404, message: "Parent Sub Category not found" });
    }
    res.status(200).json({
      status: 200,
      data: parentCategory,
      message: "Parent Sub Category fetched successfully",
    });
  } catch (err) {
    res.status(500).json({ status: 500, message: err });
    next(err);
  }
};

exports.getParentCategoryByCategoryId = async (req, res, next) => {
  const { productCategoryID } = req.params;

  const order = [["productCategoryID", "ASC"]];

  try {
    const parentSubCategoryById = await ParentSubCategory.findAndCountAll({
      where: { productCategoryID: productCategoryID },
      order,
    });

    res.status(200).json({
      status: 200,
      data: parentSubCategoryById.rows,
      totalCount: parentSubCategoryById.count,
      message: "Parent Sub Category Data Fetched Successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });

    next(err);
  }
};

exports.uploadparentsubcategory = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).send("Please upload an excel file!");

    let path = "./uploads/" + req.file.filename;
    const rows = await readXlsxFile(path);
    rows.shift();
    const category = [];

    for (let row of rows) {
      const product = {
        parentSubCategoryName: row[0],
        description: row[1],
        productCategoryID: req.body.productCategoryID,
        createBy: req.body.createBy,
        createByIp: req.body.createByIp,
      };
      category.push(product);
    }

    await sequelize.transaction(async (t) => {
      await ParentSubCategory.bulkCreate(category, { transaction: t });
      fs.unlink(path, (err) => {
        if (err) {
          console.error(`Error deleting file: ${err.message}`);
        } else {
          console.log("File deleted successfully", path);
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
