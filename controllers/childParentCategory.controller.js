const productCategory = require("../models/productCategory");
const ParentSubCategory = require("../models/parentSubCategory");
const ChildParentCategory = require("../models/childParentCategory");
const Sequelize = require("sequelize");

exports.addChildCategory = async (req, res, next) => {
  try {
    const {
      childParentCategoryName,
      description,
      parentSubCategoryID,
      productCategoryID,
      createBy,
      createByIp,
    } = req.body;

    const validation = childParentCategoryName.toLowerCase().trim();

    const existingCategory = await ChildParentCategory.findOne({
      where: { childParentCategoryName: validation },
    });

    if (existingCategory) {
      return res.status(200).json({
        status: 400,
        message: "Child Sub Category with the same name already exists",
      });
    }

    const newChildCategory = await ChildParentCategory.create({
      childParentCategoryName,
      description,
      parentSubCategoryID,
      productCategoryID,
      createBy,
      createByIp,
    });

    res.status(200).json({
      status: 200,
      message: "child category added sucessfully",
      data: newChildCategory,
    });
  } catch (error) {
    res.status(500).json({ status: 500, error: error.message });
    next(error);
  }
};

exports.editChildCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      childParentCategoryName,
      description,
      parentSubCategoryID,
      productCategoryID,
      updateBy,
      updateByIp,
    } = req.body;

    const validation = childParentCategoryName.toLowerCase().trim();

    const existingCategory = await ChildParentCategory.findOne({
      where: { childParentCategoryName: validation },
    });

    if (existingCategory) {
      return res.status(200).json({
        status: 400,
        message: "Child Sub Category with the same name already exists",
      });
    }

    const updateChildCategory = await ChildParentCategory.update(
      {
        childParentCategoryName: validation,
        description,
        parentSubCategoryID,
        productCategoryID,
        updateBy,
        updateByIp,
      },
      { where: { childParentCategoryID: id } }
    );

    res.status(200).json({
      status: 200,
      message: "Child Sub Category updated successfully",
      data: updateChildCategory,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      error: error.message,
    });
    next(error);
  }
};

exports.deleteChildCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    await ChildParentCategory.update(
      { status: "2" },
      { where: { childParentCategoryID: id } }
    );
    res.status(200).json({
      status: 200,
      message: "Child Sub Category deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ status: 500, error: error.message });
  }
};

exports.getAllChildCategory = async (req, res, next) => {
  const { page, limit, searchQuery, exportData } = req.body;

  try {
    // const {searchQuery, exportData} = req.body;

    const condition = {};
    if (searchQuery) {
      condition[Sequelize.Op.or] = [
        {
          childParentCategoryName: {
            [Sequelize.Op.iLike]: "%" + searchQuery + "%",
          },
        },
      ];
    }

    condition.status = [0, 1];
    const order = [["childParentCategoryID", "ASC"]];
    const paginationQuery = {};

    if (!exportData) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const categories = await ChildParentCategory.findAndCountAll({
      raw: true,
      where: condition,
      order,
      ...paginationQuery,
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
      message: "Product Child category fetched successfully",
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

exports.poststatuschange = async (req, res, next) => {
  try {
    let { childParentCategoryID, status } = await req.body;
    let change_status;

    let result = await sequelize.transaction(async (t) => {
      if (status == "1") {
        change_status = await ChildParentCategory.update(
          {
            status: "1",
          },
          {
            where: {
              childParentCategoryID: childParentCategoryID,
              status: ["1", "0"],
            },
            transaction: t,
          }
        );
      } else {
        change_status = await ChildParentCategory.update(
          {
            status: "0",
          },
          {
            where: {
              childParentCategoryID: childParentCategoryID,
              status: ["1", "0"],
            },
            transaction: t,
          }
        );
      }
    });

    const message =
      status == 1
        ? "Child Sub Category is activated successfully."
        : "Child Sub Category is deativated successfully.";

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

exports.getChildCategorybyParentCategoryId = async (req, res, next) => {
  const { parentSubCategoryID } = req.params; // Change req.param to req.params

  const order = [["parentSubCategoryID", "ASC"]];

  try {
    const childSubCategoryById = await ChildParentCategory.findAndCountAll({
      where: { parentSubCategoryID: parentSubCategoryID, status: 1 },
      order,
    });

    res.status(200).json({
      status: 200,
      data: childSubCategoryById.rows,
      totalCount: childSubCategoryById.count,
      message: "Child Sub Category Data Fetched Successfully", // Fixed typo
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });

    next(err);
  }
};

exports.getChildParentCategorybyId = async (req, res, next) => {
  const { childParentCategoryID } = req.params; // Change req.param to req.params

  const order = [["childParentCategoryID", "ASC"]];

  try {
    const childparentCategory = await ChildParentCategory.findByPk(
      childParentCategoryID,
      {
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
      }
    );
    res.status(200).json({
      status: 200,
      data: childparentCategory,
      message: "Child Parent Sub Category Data Fetched Successfully", // Fixed typo
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });

    next(err);
  }
};

exports.uploadChildParentCategory = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).send("Please upload an excel file!");

    let path = "./uploads/" + req.file.filename;
    const rows = await readXlsxFile(path);
    rows.shift();
    const category = [];

    for (let row of rows) {
      const product = {
        childParentCategoryName: row[0],
        description: row[1],
        productCategoryID: req.body.productCategoryID,
        parentSubCategoryID: req.body.parentSubCategoryID,
        createBy: req.body.createBy,
        createByIp: req.body.createByIp,
      };
      category.push(product);
    }

    await sequelize.transaction(async (t) => {
      await ChildParentCategory.bulkCreate(category, { transaction: t });
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
