﻿using System.Web.Mvc;

namespace MvcDatalist.Controllers.API
{
    public class DatalistColumnAttributeController : Controller
    {
        #region Properties

        [HttpGet]
        public ActionResult Position()
        {
            return View();
        }

        [HttpGet]
        public ActionResult Relation()
        {
            return View();
        }

        #endregion
    }
}
