using Xunit;

namespace Datalist.Tests.Unit
{
    public class DatalistFilterTests
    {
        #region DatalistFilter()

        [Fact]
        public void DatalistFilter_CreatesEmpty()
        {
            DatalistFilter filter = new DatalistFilter();

            Assert.Empty(filter.AdditionalFilters);
            Assert.Empty(filter.Selected);
            Assert.Empty(filter.CheckIds);
            Assert.Equal(20, filter.Rows);
            Assert.Empty(filter.Ids);
        }

        #endregion
    }
}
