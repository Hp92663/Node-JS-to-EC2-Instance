const productMaster = require("../models/productMaster");
const productCategory = require("../models/productCategory");
const ParentSubCategory = require("../models/parentSubCategory");
const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const { generateExcel } = require("../utils/exportData");
const readXlsxFile = require("read-excel-file/node");
const fs = require("fs");

// add
exports.addCategory = async (req, res) => {
  try {
    const { categoryName, description, createBy, createByIp } = req.body;

    const validation = categoryName.toLowerCase().trim();

    const existingCategory = await productCategory.findOne({
      where: { categoryName: validation },
    });
    if (existingCategory) {
      return res.status(200).json({
        status: 400,
        message: "Category with the same name already exists",
      });
    }

    const newCategory = await productCategory.create({
      categoryName,
      description,
      createBy,
      createByIp,
    });

    res.status(200).json({
      status: 200,
      message: "product category added sucessfully",
      data: newCategory,
    });
  } catch (error) {
    res.status(500).json({ status: 500, error: error.message });
  }
};

// edit
exports.editCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryName, description, updateBy, updateByIp } = req.body;

    const validation = categoryName.toLowerCase().trim();

    const existingCategory = await productCategory.findOne({
      where: { categoryName: validation },
    });
    if (existingCategory) {
      return res.status(200).json({
        status: 400,
        message: "Category with the same name already exists",
      });
    }
    await productCategory.update(
      { categoryName: validation, description, updateBy, updateByIp },
      { where: { productCategoryID: id } }
    );

    res.status(200).json({
      status: 200,
      message: "Category updated successfully",
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
    const { deleteBy, deleteByIp } = req.body;
    const parentcategoryCount = await ParentSubCategory.count({
      where: { productCategoryID: id },
    });
    if (parentcategoryCount > 0) {
      return res.status(200).json({
        status: 400,
        message:
          "Can't delete category it is associated with parent sub-category",
      });
    }
    await productCategory.update(
      { status: "2", deleteBy, deleteByIp },
      { where: { productCategoryID: id } }
    );
    res.status(200).json({
      status: 200,
      message: "Category deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      error: error.message,
    });
  }
};

// all category
exports.getAllCategories = async (req, res, next) => {
  try {
    // const {searchQuery, exportData} = req.body;
    const { page , limit , searchQuery, exportData } = await req.body;

    const condition = {};
    if (searchQuery) {
      condition[Sequelize.Op.or] = [
        { categoryName: { [Sequelize.Op.iLike]: "%" + searchQuery + "%" } },
      ];
    }

    condition.status = [0, 1];
    const order = [["productCategoryID", "ASC"]];
    const paginationQuery = {};

    if (!exportData) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const categories = await productCategory.findAndCountAll({
      raw: true,
      where: condition,
      order,
      ...paginationQuery,
    });

    if (exportData) {
      const finaldata = [];

      for (let i = 0; i < categories.rows.length; i++) {
        const rowData = categories.rows[i]; // Fetch the row directly

        const object = {
          productCategoryID: rowData.productCategoryID,
          categoryName: rowData.categoryName,
          description: rowData.description,
        };
        finaldata.push(object);
      }
      await generateExcel(finaldata, "Product Category", "xlsx", res);
      return;
    }

    res.status(200).json({
      message: "Product category fetched successfully",
      status: 200,
      data: categories.rows,
      totalcount: categories.count,
      page: +page,
      pageSize: paginationQuery.limit,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
    next(error);
  }
};

// all category
exports.getAllDeletedCategories = async (req, res, next) => {
  const { page, limit, searchQuery, exportData } = req.body;

  try {
    const condition = {};

    condition.status = [2];
    if (searchQuery) {
      condition[Sequelize.Op.or] = [
        { categoryName: { [Sequelize.Op.iLike]: "%" + searchQuery + "%" } },
      ];
    }

    const order = [["categoryName", "ASC"]];
    const paginationQuery = {};

    if (!exportData) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const categories = await productCategory.findAndCountAll({
      raw: true,
      where: condition,
      order,
      ...paginationQuery,
    });

    res.status(200).json({
      message: "Product category fetched successfully",
      status: 200,
      data: categories.rows,
      totalcount: categories.count,
      page: +page,
      pageSize: paginationQuery.limit,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
    next(error);
  }
};

// get category by id
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await productCategory.findByPk(id);
    if (!category) {
      res.status(200).json({
        status: 404,
        message: "Category not found",
      });
      return;
    }
    res.status(200).json({
      status: 200,
      message: "category get sucessfully",
      data: category,
    });
  } catch (error) {
    res.status(500).json({ status: 500, error: error.message });
  }
};

// status change

exports.poststatuschange = async (req, res, next) => {
  try {
    const { productCategoryID, status } = req.body;

    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (status === "1") {
        delete_status = await productCategory.update(
          { status: "1" },
          {
            where: { productCategoryID: productCategoryID, status: ["1", "0"] },
            transaction: t,
          }
        );
      } else {
        const associatedProducts = await productMaster.findOne({
          where: {
            productCategoryID: productCategoryID,
            status: ["0", "1"],
          },
        });

        if (associatedProducts) {
          return res.status(200).json({
            status: 401,
            message:
              "You cannot deactivate this category. It is already associated with products.",
          });
        } else {
          delete_status = await productCategory.update(
            { status: "0" },
            {
              where: {
                productCategoryID: productCategoryID,
                status: ["1", "0"],
              },
              transaction: t,
            }
          );
        }
      }

      const message =
        status == 1
          ? "Category is activated successfully."
          : "Category is deativated successfully.";

      if (delete_status[0] !== 0) {
        res.status(200).json({
          status: 200,
          message: message,
          data: {},
        });
      } else {
        res.status(200).json({
          status: 200,
          message: "No records were updated",
          data: {},
        });
      }
      return delete_status;
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// recycle category

exports.recycleDeletedCategory = async (req, res, next) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res
        .status(200)
        .json({ status: 400, message: "ID parameter is missing" });
    }

    await productCategory.update(
      { status: "1" },
      { where: { productCategoryID: id } }
    );

    res.status(200).json({
      status: 200,
      message: "Category recycled successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
    next(error);
  }
};

exports.uploadProductCategory = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).send("Please upload an excel file!");

    let path = "./uploads/" + req.file.filename;
    const rows = await readXlsxFile(path);
    rows.shift();
    const category = [];

    for (let row of rows) {
      const product = {
        categoryName: row[0],
        description: row[1],
        createBy: req.body.createBy,
        createByIp: req.body.createByIp,
      };
      category.push(product);
    }

    await sequelize.transaction(async (t) => {
      await productCategory.bulkCreate(category, { transaction: t });
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
